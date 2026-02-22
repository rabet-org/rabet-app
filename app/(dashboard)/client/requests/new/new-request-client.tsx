"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAlertHelpers } from "@/components/ui/alert-toast";
import {
  PlusIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XIcon,
  UploadIcon,
} from "@phosphor-icons/react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  slug: string;
};

export function NewRequestClient() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { success, error } = useAlertHelpers();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    budget_range: "",
    location: "",
    deadline: "",
    project_duration: "",
    experience_level: "",
    attachments: [] as string[],
    skills_required: [] as string[],
    preferred_language: "arabic",
    is_urgent: false,
  });

  const [skillInput, setSkillInput] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const json = await res.json();
        setCategories(json.data || []);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.category_id) {
      error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        success("Request created successfully!");
        setTimeout(() => {
          router.push("/client/requests");
        }, 1000);
      } else {
        const json = await res.json();
        error(json.error?.message || "Failed to create request");
      }
    } catch (err) {
      error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills_required.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills_required: [...formData.skills_required, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills_required: formData.skills_required.filter((s) => s !== skill),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (res.ok) {
          const json = await res.json();
          uploadedUrls.push(json.data.url);
        }
      }
      
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...uploadedUrls],
      }));
      
      success(`${uploadedUrls.length} file(s) uploaded successfully`);
    } catch (err) {
      error("Failed to upload files");
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeAttachment = (url: string) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((a) => a !== url),
    });
  };

  const budgetPresets = [
    { label: "Less than 5,000 EGP", value: "0-5000" },
    { label: "5,000 - 10,000 EGP", value: "5000-10000" },
    { label: "10,000 - 20,000 EGP", value: "10000-20000" },
    { label: "20,000 - 50,000 EGP", value: "20000-50000" },
    { label: "More than 50,000 EGP", value: "50000+" },
  ];

  const durationOptions = [
    { label: "1 Week", value: "1_week" },
    { label: "2 Weeks", value: "2_weeks" },
    { label: "1 Month", value: "1_month" },
    { label: "2-3 Months", value: "2-3_months" },
    { label: "3+ Months", value: "3+_months" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-background dark:via-background dark:to-background">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/client/requests">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeftIcon className="size-4" />
              Back to Requests
            </Button>
          </Link>
        </div>

        <div className="text-center space-y-2 py-4">
          <h2 className="text-2xl font-semibold tracking-tight">Post a New Request</h2>
          <p className="text-sm text-muted-foreground">
            Describe your project to find the right service providers
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex items-center justify-center size-10 rounded-full border-2 transition-all ${
                  step >= s
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "border-muted-foreground/30 text-muted-foreground bg-background"
                }`}
              >
                {step > s ? (
                  <CheckCircleIcon className="size-6" weight="fill" />
                ) : (
                  <span className="text-sm font-bold">{s}</span>
                )}
              </div>
              {s < 3 && (
                <div
                  className={`w-20 h-1 mx-2 rounded-full transition-all ${
                    step > s ? "bg-primary" : "bg-muted-foreground/20"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-card/80 backdrop-blur">
          <div className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Basic Information</h2>
                  <p className="text-muted-foreground">
                    Start with the essentials of your project
                  </p>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base font-semibold">
                      Project Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Need a web developer for e-commerce site"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="h-12 text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      Choose a clear, descriptive title for your project
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-base font-semibold">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category_id: value })
                      }
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This helps providers find your request
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      Project Type
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_urgent: false })}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          !formData.is_urgent
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-semibold">Regular Project</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Standard timeline and pricing
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_urgent: true })}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          formData.is_urgent
                            ? "border-orange-500 bg-orange-500/5"
                            : "border-border hover:border-orange-500/50"
                        }`}
                      >
                        <div className="font-semibold flex items-center gap-2">
                          Urgent Project
                          <Badge className="bg-orange-500">🔥</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Need it done quickly
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!formData.title || !formData.category_id}
                    size="lg"
                    className="min-w-32"
                  >
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Project Details</h2>
                  <p className="text-muted-foreground">
                    Provide more information about your requirements
                  </p>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base font-semibold">
                      Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your project requirements, goals, and any specific details..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={10}
                      className="text-base resize-none"
                    />
                    <div className="flex items-center justify-between text-xs">
                      <p className="text-muted-foreground">
                        Be as detailed as possible to attract the right providers
                      </p>
                      <span className="text-muted-foreground">
                        {formData.description.length} characters
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      Experience Level Required
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "Entry", label: "Entry" },
                        { value: "Intermediate", label: "Intermediate" },
                        { value: "Expert", label: "Expert" },
                      ].map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, experience_level: level.value })
                          }
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            formData.experience_level === level.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="font-semibold text-sm">{level.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      Preferred Communication Language
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, preferred_language: "arabic" })
                        }
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          formData.preferred_language === "arabic"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-semibold">العربية</div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, preferred_language: "english" })
                        }
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          formData.preferred_language === "english"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-semibold">English</div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(1)} size="lg">
                    Previous
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!formData.description}
                    size="lg"
                    className="min-w-32"
                  >
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Additional Information</h2>
                  <p className="text-muted-foreground">
                    Optional details to help providers understand your needs better
                  </p>
                </div>

                <div className="space-y-6 pt-4">
                  {/* Budget Range Presets */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Budget Range</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {budgetPresets.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, budget_range: preset.value })
                          }
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            formData.budget_range === preset.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="font-semibold text-sm">{preset.label}</div>
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="Or enter custom range (e.g., 15000-25000)"
                      value={
                        budgetPresets.find((p) => p.value === formData.budget_range)
                          ? ""
                          : formData.budget_range
                      }
                      onChange={(e) =>
                        setFormData({ ...formData, budget_range: e.target.value })
                      }
                      className="h-12 text-base mt-2"
                    />
                  </div>

                  {/* Project Duration */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Expected Project Duration</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {durationOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, project_duration: option.value })
                          }
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            formData.project_duration === option.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="font-semibold text-sm">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skills Required */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Skills Required</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill (e.g., React, Node.js, Design)"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                        className="h-12 text-base"
                      />
                      <Button
                        type="button"
                        onClick={addSkill}
                        variant="outline"
                        size="lg"
                        className="px-6"
                      >
                        Add
                      </Button>
                    </div>
                    {formData.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.skills_required.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="px-3 py-1.5 text-sm flex items-center gap-2"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="hover:text-destructive"
                            >
                              <XIcon className="size-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Add skills that the service provider should have
                    </p>
                  </div>

                  {/* Location and Deadline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-base font-semibold">
                        Location
                      </Label>
                      <Input
                        id="location"
                        placeholder="e.g., Cairo or Remote"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="h-12 text-base"
                      />
                      <p className="text-xs text-muted-foreground">
                        Specify if work is remote or at a specific location
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deadline" className="text-base font-semibold">
                        Project Deadline
                      </Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) =>
                          setFormData({ ...formData, deadline: e.target.value })
                        }
                        className="h-12 text-base"
                        min={new Date().toISOString().split("T")[0]}
                      />
                      <p className="text-xs text-muted-foreground">
                        When do you need the project completed?
                      </p>
                    </div>
                  </div>

                  {/* File Attachments */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Attachments (Optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploadingFiles}
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <UploadIcon className="size-8 text-muted-foreground" />
                        <div className="text-sm">
                          <span className="text-primary font-semibold">
                            Click to upload files
                          </span>
                          <span className="text-muted-foreground"> or drag and drop</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOC, images, or ZIP (up to 10MB)
                        </p>
                      </label>
                    </div>
                    {uploadingFiles && (
                      <p className="text-sm text-muted-foreground text-center">
                        Uploading files...
                      </p>
                    )}
                    {formData.attachments.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {formData.attachments.map((url, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <span className="text-sm truncate flex-1">
                              {url.split("/").pop()}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(url)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <XIcon className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Summary */}
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <div className="p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Review Your Request</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-2">
                        <span className="text-muted-foreground font-medium min-w-24">
                          Title:
                        </span>
                        <span className="font-medium">{formData.title}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-muted-foreground font-medium min-w-24">
                          Category:
                        </span>
                        <span className="font-medium">
                          {categories.find((c) => c.id === formData.category_id)
                            ?.name || "Not selected"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-muted-foreground font-medium min-w-24">
                          Type:
                        </span>
                        <span className="font-medium">
                          {formData.is_urgent ? "Urgent 🔥" : "Regular"}
                        </span>
                      </div>
                      {formData.experience_level && (
                        <div className="flex gap-2">
                          <span className="text-muted-foreground font-medium min-w-24">
                            Level:
                          </span>
                          <span className="font-medium">{formData.experience_level}</span>
                        </div>
                      )}
                      {formData.budget_range && (
                        <div className="flex gap-2">
                          <span className="text-muted-foreground font-medium min-w-24">
                            Budget:
                          </span>
                          <span className="font-medium">
                            {budgetPresets.find((p) => p.value === formData.budget_range)
                              ?.label || formData.budget_range}
                          </span>
                        </div>
                      )}
                      {formData.project_duration && (
                        <div className="flex gap-2">
                          <span className="text-muted-foreground font-medium min-w-24">
                            Duration:
                          </span>
                          <span className="font-medium">
                            {durationOptions.find(
                              (d) => d.value === formData.project_duration,
                            )?.label || formData.project_duration}
                          </span>
                        </div>
                      )}
                      {formData.skills_required.length > 0 && (
                        <div className="flex gap-2">
                          <span className="text-muted-foreground font-medium min-w-24">
                            Skills:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {formData.skills_required.map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {formData.attachments.length > 0 && (
                        <div className="flex gap-2">
                          <span className="text-muted-foreground font-medium min-w-24">
                            Attachments:
                          </span>
                          <span className="font-medium">
                            {formData.attachments.length} file(s)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(2)} size="lg">
                    Previous
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    size="lg"
                    className="min-w-40 gap-2"
                  >
                    <PlusIcon className="size-5" />
                    {loading ? "Creating..." : "Create Request"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
