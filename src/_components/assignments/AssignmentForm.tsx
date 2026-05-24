"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  UploadCloud,
  CalendarPlus,
  Plus,
  Minus,
  FileText,
  ChevronDown,
  X,
  RefreshCw,
  Sparkles
} from "lucide-react";

import {
  QUESTION_TYPES,
  AssignmentFormValues
} from "../../../types/assignment-form-types";

import axios from "axios";
import { toast } from "sonner";

export default function AssignmentForm() {

  const [isDragging, setIsDragging] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState<number | null>(null);

  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultValues: AssignmentFormValues = {
    assignmentName: "",
    uploadedFile: null,
    dueDate: "2026-06-30",
    questionTypes: [
      {
        id: "1",
        type: "Multiple Choice Questions",
        numberOfQuestions: 4,
        marks: 1
      },
      {
        id: "2",
        type: "Short Questions",
        numberOfQuestions: 3,
        marks: 2
      },
      {
        id: "3",
        type: "Diagram/Graph-Based Questions",
        numberOfQuestions: 5,
        marks: 5
      },
      {
        id: "4",
        type: "Numerical Problems",
        numberOfQuestions: 5,
        marks: 5
      },
    ],
    additionalNotes: ""
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<AssignmentFormValues>({
    defaultValues
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "questionTypes"
  });

  const questionTypesWatch = watch("questionTypes") || [];
  const uploadedFile = watch("uploadedFile");

  const totalQuestionsSum = questionTypesWatch.reduce(
    (acc, curr) => acc + (Number(curr?.numberOfQuestions) || 0),
    0
  );

  const totalMarksSum = questionTypesWatch.reduce(
    (acc, curr) =>
      acc +
      ((Number(curr?.numberOfQuestions) || 0) *
        (Number(curr?.marks) || 0)),
    0
  );

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

  const handleFileSelected = (file: File) => {

    if (file.size > 1 * 1024 * 1024) {
      toast.error("File size should be less than 1MB.");
      return;
    }

    if (file.type !== "text/plain") {
      toast.error("Only .txt files are allowed.");
      return;
    }

    setValue("uploadedFile", {
      name: file.name,
      size: file.size,
      type: file.type,
      actualFile: file
    });
  };

  const removeUploadedFile = (
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setValue("uploadedFile", null);
  };

  useEffect(() => {

    const handleClickOutside = (
      event: MouseEvent
    ) => {

      if (showTypeDropdown !== null) {

        const currentRef =
          dropdownRefs.current[showTypeDropdown];

        if (
          currentRef &&
          !currentRef.contains(event.target as Node)
        ) {
          setShowTypeDropdown(null);
        }
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

  }, [showTypeDropdown]);

  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (
    data: AssignmentFormValues
  ) => {

    try {

      setIsLoading(true);

      const formData = new FormData();

      formData.append(
        "assignmentName",
        data.assignmentName
      );

      formData.append(
        "dueDate",
        data.dueDate
      );

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

      if (data.additionalNotes?.trim()) {

        formData.append(
          "additionalNotes",
          data.additionalNotes.trim()
        );
      }

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
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      reset();

      toast.success(
        response.data.message ||
        "Assignment submitted successfully"
      );

    } catch (error) {

      console.error(error);

      toast.error(
        "Error submitting assignment. Please try again."
      );

    } finally {

      setIsLoading(false);
    }
  };

  return (

    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6 w-full"
    >

      <div
        id="assignment-details-card"
        className="
          bg-[#f0f2f5]
          border border-[#e4e7eb]
          rounded-[28px] sm:rounded-[36px]
          p-4 sm:p-6 md:p-10
          select-none
          shadow-xs
          w-full
          max-w-2xl
          mx-auto
          overflow-hidden
        "
      >

        {/* Header */}

        <div className="mb-8">

          <h2 className="text-xl sm:text-2xl font-bold text-[#1E2022] tracking-tight">
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
            {...register("assignmentName", {
              required:
                "Assignment name is required"
            })}
            placeholder="e.g. Chapter 5 — Forces & Motion"
            className="
              w-full
              bg-[#EAECEF]/90
              border-0
              focus:bg-white
              focus:ring-2
              focus:ring-gray-300
              transition-all
              rounded-full
              px-5 py-3
              text-sm
              text-[#2F343A]
              font-semibold
              placeholder-gray-400
              focus:outline-none
            "
          />

          {errors.assignmentName && (
            <p className="text-red-500 text-xs font-semibold mt-1.5 pl-3">
              {errors.assignmentName.message}
            </p>
          )}

        </div>

        {/* Upload Zone */}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() =>
            fileInputRef.current?.click()
          }
          className={`
            relative
            border-2 border-dashed
            rounded-3xl
            bg-white
            transition-all duration-300
            cursor-pointer
            flex flex-col
            items-center justify-center
            p-5 sm:p-8
            text-center

            ${
              isDragging
                ? "border-[#1E2022] bg-gray-50/50 scale-[0.99] ring-4 ring-gray-100"
                : "border-[#D8DDE4] hover:border-gray-400"
            }
          `}
        >

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".txt"
            onChange={(e) =>
              e.target.files?.[0] &&
              handleFileSelected(
                e.target.files[0]
              )
            }
          />

          {!uploadedFile ? (

            <div className="flex flex-col items-center">

              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3">
                <UploadCloud className="text-[#1E2022] w-6 h-6 stroke-2" />
              </div>

              <h3 className="text-[#2F343A] font-semibold text-sm sm:text-base">
                Choose a file or drag & drop it here
              </h3>

              <p className="text-[#8B93A1] text-xs font-bold tracking-wider mt-1.5 uppercase">
                TXT file upto 1MB
              </p>

              <button
                type="button"
                className="
                  mt-4
                  px-6 py-2.5
                  bg-[#F4F6F8]
                  hover:bg-[#EAECEF]
                  text-[#1D2024]
                  text-xs font-bold
                  rounded-full
                  transition-all
                  border border-gray-100
                "
              >
                Browse Files
              </button>

            </div>

          ) : (

            <div className="w-full flex flex-col items-center p-2">

              <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center mb-3 border border-gray-100">
                <FileText className="text-gray-500 w-7 h-7" />
              </div>

              <div className="max-w-full">

                <p
                  className="text-sm font-semibold text-gray-800 truncate max-w-55 sm:max-w-sm"
                  title={uploadedFile.name}
                >
                  {uploadedFile.name}
                </p>

                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>

              </div>

              <button
                type="button"
                onClick={removeUploadedFile}
                className="
                  mt-4
                  flex items-center gap-1
                  px-4 py-1.5
                  bg-red-50 hover:bg-red-100
                  text-red-600
                  text-xs font-bold
                  rounded-full
                  transition-colors
                  border border-red-100
                "
              >
                <X size={12} />
                Remove File
              </button>

            </div>
          )}

        </div>

        <p className="text-[#8B93A1] text-xs sm:text-sm text-center mt-3 font-medium">
          Upload txt files only (Optional)
        </p>

        {/* Due Date */}

        <div className="mt-8">

          <label className="text-sm font-bold text-[#1E2022] block mb-2 tracking-wide">
            Due Date
          </label>

          <div className="relative">

            <input
              type="date"
              {...register("dueDate", {
                required:
                  "Due date is required"
              })}
              className="
                w-full
                bg-[#EAECEF]/90
                border-0
                focus:bg-white
                focus:ring-2
                focus:ring-gray-300
                transition-all
                rounded-full
                px-5 py-3
                text-sm
                text-[#2F343A]
                font-semibold
                focus:outline-none
                appearance-none
              "
            />

            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <CalendarPlus
                size={20}
              />
            </div>

          </div>

        </div>

        {/* Question Section */}

        <div className="mt-8">

          <div className="hidden sm:grid grid-cols-[1fr_24px_100px_100px] gap-3 mb-3 px-2">

            <span className="text-xs font-bold text-[#848B96]">
              Question Type
            </span>

            <span />

            <span className="text-xs font-bold text-[#848B96] text-center">
              No. of Questions
            </span>

            <span className="text-xs font-bold text-[#848B96] text-center">
              Marks
            </span>

          </div>

          <div className="space-y-4">

            {fields.map((field, index) => {

              const currentQuestion =
                questionTypesWatch[index];

              return (

                <div
                  key={field.id}
                  className="
                    flex flex-col
                    sm:grid
                    sm:grid-cols-[1fr_24px_100px_100px]
                    gap-3
                  "
                >

                  {/* Dropdown */}

                  <div
                    ref={(el) => {
                      dropdownRefs.current[index] = el;
                    }}
                    className="relative"
                  >

                    <span className="sm:hidden text-xs font-bold text-[#848B96] px-1 mb-1 block">
                      Question Type
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setShowTypeDropdown(
                          showTypeDropdown === index
                            ? null
                            : index
                        )
                      }
                      className="
                        w-full
                        bg-white
                        rounded-full
                        px-5 py-3
                        text-left
                        text-sm
                        font-semibold
                        border border-gray-100
                        flex items-center justify-between
                      "
                    >

                      <span className="truncate">
                        {currentQuestion.type}
                      </span>

                      <ChevronDown
                        size={14}
                      />

                    </button>

                    {showTypeDropdown === index && (

                      <div
                        className="
                          absolute
                          z-30
                          left-0 right-0
                          mt-2
                          bg-white
                          border border-gray-100
                          rounded-2xl
                          shadow-xl
                          max-h-56
                          overflow-y-auto
                          py-1
                        "
                      >

                        {QUESTION_TYPES.map(
                          (typeOption) => (

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
                              className={`
                                w-full
                                text-left
                                px-5 py-3
                                text-sm
                                transition-colors

                                ${
                                  currentQuestion.type === typeOption
                                    ? "bg-[#1E2022] text-white"
                                    : "hover:bg-gray-100 text-gray-700"
                                }
                              `}
                            >
                              {typeOption}
                            </button>
                          )
                        )}

                      </div>
                    )}

                  </div>

                  {/* Remove */}

                  <div className="flex justify-end sm:justify-center">

                    <button
                      type="button"
                      onClick={() =>
                        fields.length > 1
                          ? remove(index)
                          : null
                      }
                      disabled={fields.length <= 1}
                      className="
                        w-7 h-7
                        flex items-center justify-center
                        rounded-full
                        hover:bg-gray-200
                        text-gray-500
                      "
                    >
                      ×
                    </button>

                  </div>

                  {/* Questions */}

                  <div>

                    <span className="sm:hidden text-xs font-bold text-[#848B96] px-1 mb-1 block">
                      No. of Questions
                    </span>

                    <div className="flex items-center justify-between bg-white border border-gray-50 rounded-full px-3 py-2">

                      <button
                        type="button"
                        onClick={() =>
                          update(index, {
                            ...field,
                            numberOfQuestions:
                              Math.max(
                                1,
                                currentQuestion.numberOfQuestions - 1
                              )
                          })
                        }
                      >
                        <Minus size={14} />
                      </button>

                      <span className="font-bold text-sm">
                        {currentQuestion.numberOfQuestions}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          update(index, {
                            ...field,
                            numberOfQuestions:
                              Math.min(
                                100,
                                currentQuestion.numberOfQuestions + 1
                              )
                          })
                        }
                      >
                        <Plus size={14} />
                      </button>

                    </div>

                  </div>

                  {/* Marks */}

                  <div>

                    <span className="sm:hidden text-xs font-bold text-[#848B96] px-1 mb-1 block">
                      Marks
                    </span>

                    <div className="flex items-center justify-between bg-white border border-gray-50 rounded-full px-3 py-2">

                      <button
                        type="button"
                        onClick={() =>
                          update(index, {
                            ...field,
                            marks:
                              Math.max(
                                1,
                                currentQuestion.marks - 1
                              )
                          })
                        }
                      >
                        <Minus size={14} />
                      </button>

                      <span className="font-bold text-sm">
                        {currentQuestion.marks}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          update(index, {
                            ...field,
                            marks:
                              Math.min(
                                100,
                                currentQuestion.marks + 1
                              )
                          })
                        }
                      >
                        <Plus size={14} />
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

          {/* Bottom Section */}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 gap-5">

            <button
              type="button"
              onClick={() => {

                const usedTypes =
                  questionTypesWatch.map(
                    q => q.type
                  );

                const nextType =
                  QUESTION_TYPES.find(
                    t => !usedTypes.includes(t)
                  ) || QUESTION_TYPES[1];

                append({
                  id: String(Date.now()),
                  type: nextType,
                  numberOfQuestions: 5,
                  marks: 5
                });

              }}
              className="flex items-center gap-2 text-sm font-bold"
            >

              <div className="w-7 h-7 bg-[#1E2022] text-white rounded-full flex items-center justify-center">
                <Plus size={14} />
              </div>

              Add Question Type

            </button>

            <div className="w-full sm:w-auto text-left sm:text-right text-sm font-semibold space-y-1">

              <div>
                Total Questions :
                <span className="font-bold ml-1">
                  {totalQuestionsSum}
                </span>
              </div>

              <div>
                Total Marks :
                <span className="font-bold ml-1">
                  {totalMarksSum}
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* Additional Notes */}

        <div className="mt-8">

          <label className="text-sm font-bold text-[#1E2022] block mb-2 tracking-wide">
            Additional Information
          </label>

          <textarea
            {...register("additionalNotes")}
            rows={4}
            placeholder="e.g Generate a question paper for 3 hour exam duration..."
            className="
              w-full
              bg-[#EAECEF]/40
              border-2 border-dashed
              border-[#D1D5DC]
              rounded-3xl
              p-5
              text-sm
              resize-none
              focus:outline-none
              focus:border-gray-400
              transition-all
            "
          />

        </div>

        {/* Submit */}

        <div className="mt-8 flex justify-center">

          <button
            type="submit"
            className="
              w-full
              bg-[#1E2022]
              hover:bg-black
              text-white
              py-3 sm:py-3.5
              px-4 sm:px-6
              rounded-full
              font-bold
              text-sm sm:text-base
              transition-all
              flex items-center justify-center gap-2
            "
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