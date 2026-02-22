import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api-response";
import { authenticate, isAuthenticated } from "@/lib/auth";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    if (!isAuthenticated(auth)) return auth;
    if (auth.role !== "admin") {
      return ApiError.forbidden();
    }

    const { searchParams } = new URL(req.url);
    const typesParam = searchParams.get("types") || "users";
    const types = typesParam.split(",");
    const format = searchParams.get("format") || "excel";

    const allData: Record<string, any[]> = {};

    for (const type of types) {
      let data: any[] = [];

      switch (type) {
        case "users":
          const users = await db.user.findMany({
            include: { profile: true },
          });
          data = users.map((u: any) => ({
            ID: u.id,
            Email: u.email,
            Role: u.role,
            "Full Name": u.profile?.full_name || "",
            Phone: u.profile?.phone || "",
            "Email Verified": u.email_verified ? "Yes" : "No",
            Active: u.is_active ? "Yes" : "No",
            Blocked: u.is_blocked ? "Yes" : "No",
            "Created At": u.created_at.toISOString(),
          }));
          break;

        case "providers":
          const providers = await db.providerProfile.findMany({
            include: {
              user: { include: { profile: true } },
              wallet: true,
            },
          });
          data = providers.map((p: any) => ({
            ID: p.id,
            "User Email": p.user.email,
            "Full Name": p.user.profile?.full_name || "",
            Verified: p.is_verified ? "Yes" : "No",
            Active: p.is_active ? "Yes" : "No",
            "Wallet Balance": p.wallet?.balance.toString() || "0",
            "Created At": p.created_at.toISOString(),
          }));
          break;

        case "requests":
          const requests = await db.request.findMany({
            include: {
              user: { include: { profile: true } },
              category: true,
            },
          });
          data = requests.map((r: any) => ({
            ID: r.id,
            Title: r.title,
            Category: r.category.name,
            "Client Email": r.user.email,
            Status: r.status,
            "Unlock Fee": r.unlock_fee.toString(),
            "Created At": r.created_at.toISOString(),
          }));
          break;

        case "reviews":
          const reviews = await db.review.findMany({
            include: {
              client: { include: { profile: true } },
              provider: { include: { user: { include: { profile: true } } } },
            },
            where: { deleted_at: null },
          });
          data = reviews.map((r: any) => ({
            ID: r.id,
            "Client Email": r.client.email,
            "Provider Email": r.provider.user.email,
            Rating: r.rating,
            Comment: r.comment || "",
            "Created At": r.created_at.toISOString(),
          }));
          break;

        case "transactions":
          const transactions = await db.walletTransaction.findMany({
            include: {
              wallet: {
                include: {
                  provider: {
                    include: { user: { include: { profile: true } } },
                  },
                },
              },
            },
          });
          data = transactions.map((t: any) => ({
            ID: t.id,
            "Provider Email": t.wallet.provider.user.email,
            Type: t.type,
            Amount: t.amount.toString(),
            "Balance Before": t.balance_before.toString(),
            "Balance After": t.balance_after.toString(),
            Description: t.description || "",
            "Created At": t.created_at.toISOString(),
          }));
          break;

        case "unlocks":
          const unlocks = await db.leadUnlock.findMany({
            include: {
              request: true,
              provider: { include: { user: { include: { profile: true } } } },
            },
          });
          data = unlocks.map((u: any) => ({
            ID: u.id,
            "Request Title": u.request.title,
            "Provider Email": u.provider.user.email,
            "Unlock Fee": u.unlock_fee.toString(),
            Status: u.status,
            "Unlocked At": u.unlocked_at.toISOString(),
          }));
          break;
      }

      if (data.length > 0) {
        allData[type] = data;
      }
    }

    if (Object.keys(allData).length === 0) {
      return ApiError.notFound("No data to export");
    }

    // Generate based on format
    if (format === "excel") {
      return await generateExcel(allData);
    } else if (format === "pdf") {
      return await generatePDF(allData);
    } else {
      // CSV
      return generateCSV(allData);
    }
  } catch (error) {
    console.error("Error exporting data:", error);
    return ApiError.internal("Failed to export data");
  }
}

async function generateExcel(allData: Record<string, any[]>) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Rabet Platform";
  workbook.created = new Date();

  for (const [sheetName, data] of Object.entries(allData)) {
    const worksheet = workbook.addWorksheet(
      sheetName.charAt(0).toUpperCase() + sheetName.slice(1)
    );

    if (data.length > 0) {
      const headers = Object.keys(data[0]);

      // Add header row with styling
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F46E5" },
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };

      // Add data rows
      data.forEach((row) => {
        worksheet.addRow(Object.values(row));
      });

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const length = cell.value ? cell.value.toString().length : 10;
          if (length > maxLength) {
            maxLength = length;
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      });

      // Add filters
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: headers.length },
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rabet_export_${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  });
}

async function generatePDF(allData: Record<string, any[]>) {
  const doc = new jsPDF();
  let yPosition = 20;

  // Add title
  doc.setFontSize(18);
  doc.text("Rabet Platform Export", 14, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
  yPosition += 15;

  for (const [tableName, data] of Object.entries(allData)) {
    if (data.length === 0) continue;

    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Add section title
    doc.setFontSize(14);
    doc.text(
      tableName.charAt(0).toUpperCase() + tableName.slice(1),
      14,
      yPosition
    );
    yPosition += 7;

    const headers = Object.keys(data[0]);
    const rows = data.map((row) => Object.values(row)) as any[];

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: yPosition,
      theme: "grid",
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 30 },
      },
      didDrawPage: (data) => {
        yPosition = data.cursor?.y || yPosition;
      },
    });

    yPosition += 10;
  }

  const pdfBuffer = doc.output("arraybuffer");

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rabet_export_${new Date().toISOString().split("T")[0]}.pdf"`,
    },
  });
}

function generateCSV(allData: Record<string, any[]>) {
  let csv = "";

  for (const [tableName, data] of Object.entries(allData)) {
    if (data.length === 0) continue;

    // Add section header
    csv += `\n${tableName.toUpperCase()}\n`;

    const headers = Object.keys(data[0]);
    csv += headers.join(",") + "\n";

    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header];
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(",") ? `"${escaped}"` : escaped;
      });
      csv += values.join(",") + "\n";
    });

    csv += "\n";
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="rabet_export_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
