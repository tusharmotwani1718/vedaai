"use client";
import React, { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  UploadCloud,
  CalendarPlus,
  Plus,
  Minus,
  Mic,
  MicOff,
  FileText,
  CheckCircle2,
  Trash2,
  ChevronDown,
  X,
  FileSpreadsheet,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { QUESTION_TYPES, AssignmentFormValues } from "../../../types/assignment-form-types";
import axios from "axios";
import { toast } from "sonner";

export default function AssignmentForm() {
  const [isDragging, setIsDragging] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState<number | null>(null);
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Default values matching the image exactly!
  const defaultValues: AssignmentFormValues = {
    assignmentName: "",
    uploadedFile: null,
    dueDate: "2026-06-30", // Placeholder default
    questionTypes: [
      { id: "1", type: "Multiple Choice Questions", numberOfQuestions: 4, marks: 1 },
      { id: "2", type: "Short Questions", numberOfQuestions: 3, marks: 2 },
      { id: "3", type: "Diagram/Graph-Based Questions", numberOfQuestions: 5, marks: 5 },
      { id: "4", type: "Numerical Problems", numberOfQuestions: 5, marks: 5 },
    ],
    additionalNotes: ""
  };

  const { register, control, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<AssignmentFormValues>({
    defaultValues
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "questionTypes"
  });

  const questionTypesWatch = watch("questionTypes") || [];
  const uploadedFile = watch("uploadedFile");
  const additionalNotes = watch("additionalNotes");

  // Dynamic calculations:
  const totalQuestionsSum = questionTypesWatch.reduce(
    (acc, curr) => acc + (Number(curr?.numberOfQuestions) || 0),
    0
  );
  const totalMarksSum = questionTypesWatch.reduce((acc, curr) => acc + ((Number(curr?.numberOfQuestions) || 0) * (Number(curr?.marks) || 0)), 0);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (file: File) => {
    if (file.size > 1 * 1024 * 1024) {
      toast.error("File size should be less than 1MB.");
      return;
    }

    if (
      file.type !== "text/plain" &&
      file.type !== "application/pdf"
    ) {
      toast.error("Only .txt and .pdf files are allowed.");
      return;
    }

    setValue("uploadedFile", {
      name: file.name,
      size: file.size,
      type: file.type,
      actualFile: file
    });
  };

  const removeUploadedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue("uploadedFile", null);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTypeDropdown !== null) {
        const currentRef = dropdownRefs.current[showTypeDropdown];
        if (currentRef && !currentRef.contains(event.target as Node)) {
          setShowTypeDropdown(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTypeDropdown]);



  // Form submit handler
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (
    data: AssignmentFormValues
  ) => {
    try {
      setIsLoading(true);

      const formData = new FormData();

      // required fields
      formData.append(
        "assignmentName",
        data.assignmentName
      );

      formData.append(
        "dueDate",
        data.dueDate
      );

      // questionTypes -> JSON string
      formData.append(
        "questionTypes",
        JSON.stringify(
          data.questionTypes.map((question) => ({
            type: question.type,
            numberOfQuestions:
              question.numberOfQuestions,
            marks: question.marks
          }))
        )
      );

      // optional additional notes
      if (data.additionalNotes?.trim()) {
        formData.append(
          "additionalNotes",
          data.additionalNotes.trim()
        );
      }

      // optional file upload
      if (data.uploadedFile?.actualFile) {
        formData.append(
          "file",
          data.uploadedFile.actualFile
        );
      }

      const response = await axios.post(
        "/api/assignments/create-assignment",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )

      reset();

      console.log(
        "Assignment submitted successfully:",
        response.data
      );

      toast.success(
        response.data.message || "Assignment submitted successfully"
      );
    } catch (error) {
      console.error("Submission Error:", error);

      toast.error("Error submitting assignment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Container Box */}
      <div id="assignment-details-card" className="bg-[#f0f2f5] border border-[#e4e7eb] rounded-[36px] p-6 sm:p-10 select-none shadow-xs max-w-2xl mx-auto">

        {/* Title Block */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1E2022] tracking-tight antialiased">
            Assignment Details
          </h2>
          <p className="text-[#848B96] text-sm mt-1 font-medium">
            Basic information about your assignment
          </p>
        </div>

        {/* Assignment Name */}
        <div className="mb-6">
          <label className="text-sm font-bold text-[#1E2022] block mb-2 tracking-wide">
            Assignment Name
          </label>
          <input
            type="text"
            {...register("assignmentName", { required: "Assignment name is required" })}
            placeholder="e.g. Chapter 5 — Forces & Motion"
            className="w-full bg-[#EAECEF]/90 border-0 focus:bg-white focus:ring-2 focus:ring-gray-300 transition-all rounded-full px-5 py-3 text-sm text-[#2F343A] font-semibold placeholder-gray-400 focus:outline-none"
          />
          {errors.assignmentName && (
            <p className="text-red-500 text-xs font-semibold mt-1.5 pl-3">{errors.assignmentName.message}</p>
          )}
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl bg-white transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-8 text-center ${isDragging
            ? "border-[#1E2022] bg-gray-50/50 scale-[0.99] ring-4 ring-gray-100"
            : "border-[#D8DDE4] hover:border-gray-400 hover:scale-[1.005]"
            }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".txt,.pdf,text/plain,application/pdf"
            onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
          />

          {!uploadedFile ? (
            <div className="flex flex-col items-center">
              {/* Cloud Icon */}
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3">
                <UploadCloud className="text-[#1E2022] w-6 h-6 stroke-2" />
              </div>

              <h3 className="text-[#2F343A] font-semibold text-sm sm:text-base">
                Choose a file or drag & drop it here
              </h3>
              <p className="text-[#8B93A1] text-xs font-bold tracking-wider mt-1.5 uppercase">
                TXT, PDF, up to 10MB
              </p>

              {/* Browse Button */}
              <button
                type="button"
                className="mt-4 px-6 py-2.5 bg-[#F4F6F8] hover:bg-[#EAECEF] active:scale-[0.98] text-[#1D2024] text-xs font-bold rounded-full transition-all border border-gray-100 shadow-2xs"
              >
                Browse Files
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center p-2">
              {uploadedFile.previewUrl ? (
                <div className="relative mb-3 group">
                  <img
                    src={uploadedFile.previewUrl}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-xl border border-gray-100 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center mb-3 border border-gray-100">
                  <FileText className="text-gray-500 w-7 h-7" />
                </div>
              )}

              <div className="max-w-70">
                <p className="text-sm font-semibold text-gray-800 truncate" title={uploadedFile.name}>
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              <button
                type="button"
                onClick={removeUploadedFile}
                className="mt-4 flex items-center gap-1 px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-full transition-colors border border-red-100"
              >
                <X size={12} /> Remove File
              </button>
            </div>
          )}
        </div>

        {/* Upload helpers explanation */}
        <p className="text-[#8B93A1] text-xs sm:text-sm text-center mt-3 font-medium">
          Upload txt/pdf files only (Optional)
        </p>

        {/* Due Date Element */}
        <div className="mt-8">
          <label className="text-sm font-bold text-[#1E2022] block mb-2 tracking-wide">
            Due Date
          </label>
          <div className="relative">
            <input
              type="date"
              {...register("dueDate", { required: "Due date is required" })}
              className="w-full bg-[#EAECEF]/90 border-0 focus:bg-white focus:ring-2 focus:ring-gray-300 transition-all rounded-full px-5 py-3 text-sm text-[#2F343A] font-semibold placeholder-gray-400 focus:outline-none cursor-pointer appearance-none"
            />
            <div className="absolute right-5 top-[50%] translate-y-[-50%] pointer-events-none text-[#2F343A]">
              <CalendarPlus size={20} className="stroke-[2.2]" />
            </div>
          </div>
          {errors.dueDate && (
            <p className="text-red-500 text-xs font-semibold mt-1.5 pl-3">{errors.dueDate.message}</p>
          )}
        </div>

        {/* Dynamic Question Section Header */}
        <div className="mt-8">
          <div className="grid grid-cols-[1fr_24px_100px_100px] gap-3 mb-3 px-2">
            <span className="text-xs font-bold text-[#848B96] tracking-wide">
              Question Type
            </span>
            <span className="text-xs font-bold text-[#848B96] text-center">
              {/* spacer for 'X' button */}
            </span>
            <span className="text-xs font-bold text-[#848B96] text-center leading-tight">
              No. of Questions
            </span>
            <span className="text-xs font-bold text-[#848B96] text-center select-none">
              Marks
            </span>
          </div>

          {/* Rows List */}
          <div className="space-y-3">
            {fields.map((field, index) => {
              const currentQuestion = questionTypesWatch[index] || { numberOfQuestions: 1, marks: 1, type: "" };

              return (
                <div key={field.id} className="grid grid-cols-[1fr_24px_100px_100px] gap-3 items-center">

                  {/* Select Dropdown custom-styled */}
                  <div
                    ref={(el) => { dropdownRefs.current[index] = el; }}
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() => setShowTypeDropdown(showTypeDropdown === index ? null : index)}
                      className="w-full bg-white hover:bg-gray-50 active:scale-[0.995] transition-all duration-150 rounded-full px-5 py-2.5 text-left text-xs sm:text-sm font-semibold text-[#1E2022] border border-gray-100 shadow-2xs flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{currentQuestion.type || "Select Type"}</span>
                      <ChevronDown size={14} className="text-gray-500 stroke-[2.5]" />
                    </button>

                    {showTypeDropdown === index && (
                      <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-56 overflow-y-auto overflow-hidden ring-1 ring-black/5 py-1">
                        {QUESTION_TYPES.map((typeOption) => (
                          <button
                            key={typeOption}
                            type="button"
                            onClick={() => {
                              update(index, {
                                ...field,
                                type: typeOption
                              });
                              setShowTypeDropdown(null);
                            }}
                            className={`w-full text-left px-5 py-2.5 text-xs sm:text-sm font-medium transition-colors ${currentQuestion.type === typeOption
                              ? "bg-[#1E2022] text-white"
                              : "text-gray-700 hover:bg-gray-100"
                              }`}
                          >
                            {typeOption}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Remove row multiplier action (X button in reference photo) */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => fields.length > 1 ? remove(index) : null}
                      disabled={fields.length <= 1}
                      className={`text-[#848B96] hover:text-black hover:scale-110 active:scale-95 transition-all text-sm font-bold flex items-center justify-center p-1 w-6 h-6 select-none ${fields.length <= 1 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                        }`}
                      title="Remove Row"
                    >
                      <span className="text-sm">×</span>
                    </button>
                  </div>

                  {/* No. of Questions pill numberOfQuestionser */}
                  <div className="flex items-center justify-between bg-white border border-gray-50 rounded-full px-3 py-1.5 shadow-2xs select-none">
                    <button
                      type="button"
                      onClick={() => {
                        const newnumberOfQuestions = Math.max(1, currentQuestion.numberOfQuestions - 1);
                        update(index, { ...field, numberOfQuestions: newnumberOfQuestions });
                      }}
                      className="text-[#9BA3AF] hover:text-[#1E2022] font-semibold active:scale-120 transition p-1 cursor-pointer"
                    >
                      <Minus size={14} className="stroke-[2.5]" />
                    </button>
                    <span className="font-bold text-[#1E2022] text-sm">
                      {currentQuestion.numberOfQuestions}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newnumberOfQuestions = Math.min(100, currentQuestion.numberOfQuestions + 1);
                        update(index, { ...field, numberOfQuestions: newnumberOfQuestions });
                      }}
                      className="text-[#9BA3AF] hover:text-[#1E2022] font-semibold active:scale-120 transition p-1 cursor-pointer"
                    >
                      <Plus size={14} className="stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Marks pill numberOfQuestionser */}
                  <div className="flex items-center justify-between bg-white border border-gray-50 rounded-full px-3 py-1.5 shadow-2xs select-none">
                    <button
                      type="button"
                      onClick={() => {
                        const newMarks = Math.max(1, currentQuestion.marks - 1);
                        update(index, { ...field, marks: newMarks });
                      }}
                      className="text-[#9BA3AF] hover:text-[#1E2022] font-semibold active:scale-120 transition p-1 cursor-pointer"
                    >
                      <Minus size={14} className="stroke-[2.5]" />
                    </button>
                    <span className="font-bold text-[#1E2022] text-sm">
                      {currentQuestion.marks}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newMarks = Math.min(100, currentQuestion.marks + 1);
                        update(index, { ...field, marks: newMarks });
                      }}
                      className="text-[#9BA3AF] hover:text-[#1E2022] font-semibold active:scale-120 transition p-1 cursor-pointer"
                    >
                      <Plus size={14} className="stroke-[2.5]" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Add Row and Summary Section Block */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-5 gap-4">

            {/* Add Question Button */}
            <button
              type="button"
              onClick={() => {
                // Find next unused quest type or default to Short Questions
                const usedTypes = questionTypesWatch.map(q => q.type);
                const nextType = QUESTION_TYPES.find(t => !usedTypes.includes(t)) || QUESTION_TYPES[1];
                append({
                  id: String(Date.now()),
                  type: nextType,
                  numberOfQuestions: 5,
                  marks: 5
                });
              }}
              className="flex items-center gap-2.5 font-bold text-xs sm:text-sm text-[#1E2022] hover:text-black transition-colors duration-150 cursor-pointer select-none py-1 group"
            >
              <div className="w-7 h-7 bg-[#1E2022] group-hover:bg-[#000000] text-white rounded-full flex items-center justify-center transition-colors shadow-2xs">
                <Plus size={14} className="stroke-3" />
              </div>
              Add Question Type
            </button>

            {/* Calculations outputs (Exact phrasing in photo) */}
            <div className="text-right self-end sm:self-auto space-y-1 pr-1 font-semibold text-[#1D2024] tracking-tight text-xs sm:text-sm">
              <div>
                Total Questions : <span className="font-bold font-mono pl-0.5 text-base text-gray-800">{totalQuestionsSum}</span>
              </div>
              <div>
                Total Marks : <span className="font-bold font-mono pl-0.5 text-base text-gray-800">{totalMarksSum}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Additional Information details block */}
        <div className="mt-8 relative">
          <label className="text-sm font-bold text-[#1E2022] block mb-2 tracking-wide">
            Additional Information (For better output)
          </label>
          <div className="relative">
            <textarea
              {...register("additionalNotes")}
              placeholder="e.g Generate a question paper for 3 hour exam duration..."
              rows={4}
              className="w-full bg-[#EAECEF]/40 hover:bg-[#EAECEF]/50 focus:bg-white border-2 border-dashed border-[#D1D5DC] focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-all rounded-3xl p-5 text-sm text-gray-700 placeholder-gray-400/90 focus:outline-none resize-none pr-14 leading-relaxed font-medium"
            />



          </div>
        </div>

        {/* Form CTA to process the submit */}
        <div className="mt-8 flex justify-center">
          <button
            type="submit"
            className="w-full bg-[#1E2022] hover:bg-black text-white py-3.5 px-6 rounded-full font-bold text-sm sm:text-base tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw
                  size={18}
                  className="animate-spin"
                />
                Processing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Proceed with Assignment Details
              </>
            )}
          </button>
        </div>

      </div>
    </form>
  );
}
