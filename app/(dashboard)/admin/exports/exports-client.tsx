"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAlertHelpers } from "@/components/ui/alert-toast";
import {
  DownloadIcon,
  FileTextIcon,
  UsersIcon,
  BuildingsIcon,
  ListChecksIcon,
  StarIcon,
  Coins,
  FilePdfIcon,
  FileXlsIcon,
  FileCsvIcon,
} from "@phosphor-icons/react";

type ExportType =
  | "users"
  | "providers"
  | "requests"
  | "reviews"
  | "transactions"
  | "unlocks";

type ExportFormat = "csv" | "excel" | "pdf";

export function ExportsClient() {
  const [selectedTypes, setSelectedTypes] = useState<ExportType[]>(["users"]);
  const [format, setFormat] = useState<ExportFormat>("excel");
  const [loading, setLoading] = useState(false);
  const { success, error } = useAlertHelpers();

  const exportOptions = [
    {
      value: "users" as ExportType,
      label: "Users",
      icon: UsersIcon,
      description: "All users with profiles",
    },
    {
      value: "providers" as ExportType,
      label: "Providers",
      icon: BuildingsIcon,
      description: "Providers and applications",
    },
    {
      value: "requests" as ExportType,
      label: "Requests",
      icon: ListChecksIcon,
      description: "Service requests",
    },
    {
      value: "reviews" as ExportType,
      label: "Reviews",
      icon: StarIcon,
      description: "Reviews and ratings",
    },
    {
      value: "transactions" as ExportType,
      label: "Transactions",
      icon: Coins,
      description: "Wallet transactions",
    },
    {
      value: "unlocks" as ExportType,
      label: "Lead Unlocks",
      icon: FileTextIcon,
      description: "Lead unlock history",
    },
  ];

  const formatOptions = [
    {
      value: "excel" as ExportFormat,
      label: "Excel",
      icon: FileXlsIcon,
      description: "Formatted spreadsheet (.xlsx)",
    },
    {
      value: "csv" as ExportFormat,
      label: "CSV",
      icon: FileCsvIcon,
      description: "Comma-separated values (.csv)",
    },
    {
      value: "pdf" as ExportFormat,
      label: "PDF",
      icon: FilePdfIcon,
      description: "Portable document (.pdf)",
    },
  ];

  const toggleType = (type: ExportType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleExport = async () => {
    if (selectedTypes.length === 0) {
      error("Please select at least one data type");
      return;
    }

    setLoading(true);
    try {
      const types = selectedTypes.join(",");
      const res = await fetch(
        `/api/admin/export?types=${types}&format=${format}`
      );

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        
        const extension = format === "excel" ? "xlsx" : format;
        const filename = selectedTypes.length === 1 
          ? `${selectedTypes[0]}_${new Date().toISOString().split("T")[0]}.${extension}`
          : `rabet_export_${new Date().toISOString().split("T")[0]}.${extension}`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        success("Data exported successfully");
      } else {
        error("Failed to export data");
      }
    } catch (err) {
      error("Failed to export data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Export Data</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Export platform data in multiple formats
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Select Data Types (Multiple)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {exportOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedTypes.includes(option.value);
                    return (
                      <div
                        key={option.value}
                        onClick={() => toggleType(option.value)}
                        className={`p-4 rounded-lg border-2 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleType(option.value)}
                            />
                            <Icon className="size-5 shrink-0" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Export Format</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {formatOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFormat(option.value)}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          format === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Icon className="size-8 mx-auto mb-2" />
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={loading || selectedTypes.length === 0}
                className="w-full"
                size="lg"
              >
                <DownloadIcon className="size-5 mr-2" />
                {loading ? "Exporting..." : "Export Data"}
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Selected Data</h3>
            {selectedTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No data types selected
              </p>
            ) : (
              <ul className="space-y-2">
                {selectedTypes.map((type) => {
                  const option = exportOptions.find((o) => o.value === type);
                  return (
                    <li
                      key={type}
                      className="text-sm flex items-center gap-2"
                    >
                      <div className="size-2 rounded-full bg-primary" />
                      {option?.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="p-4 bg-muted/50">
            <div className="text-sm space-y-2">
              <p className="font-medium">Format Information:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                <li>Excel: Best for data analysis with formatting</li>
                <li>CSV: Compatible with all spreadsheet apps</li>
                <li>PDF: Read-only formatted document</li>
                <li>Multiple types create separate sheets/sections</li>
                <li>All dates in ISO 8601 format</li>
                <li>Sensitive data excluded</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
