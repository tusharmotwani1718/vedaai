"use client";

import React from 'react';
import { GeneratedAssignment } from "../../../schemas/assignment.zod-schema";
import { toast } from 'sonner';

function AssignmentDisplay({
    assignment,
    showDownloadButton = true,
    _id
}: {
    assignment: GeneratedAssignment;
    showDownloadButton?: boolean,
    _id: string
}) {

    const { schoolName, subject, className, duration, maximumMarks, sections, answerKey } = assignment;

    const [downloading, setDownloading] = React.useState<boolean>(false);

    // Capitalize difficulty string
    const formatDifficulty = (difficulty?: string) => {
        if (!difficulty) return "";
        return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    };


    // download pdf:
    const downloadPDF = async () => {
        setDownloading(true);
        const response = await fetch(
            `/api/assignments/pdf/${_id}`
        );

        if (!response.ok) {
            throw new Error("Failed to generate PDF");
        }

        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;

        a.download = `assignment.pdf`;

        document.body.appendChild(a);

        a.click();

        a.remove();

        window.URL.revokeObjectURL(url);
        setDownloading(false);
    };

    return (
        <>
            {
                showDownloadButton && (
                    <button
                        onClick={downloadPDF}
                        className={`px-4 py-2 rounded-md bg-black text-white hover:bg-gray-700 transition-colors duration-300 ease-in-out ${downloading ? "opacity-50 cursor-not-allowed" : ""} disabled:opacity-50 disabled:cursor-not-allowed my-3`}
                        disabled={downloading}
                    >
                        {
                            downloading ? "Downloading..." : "Download as PDF"
                        }
                    </button>
                )
            }

            <div
                id="assignment-printed-sheet"
                className="bg-white text-black p-10 md:p-14 border border-gray-200 shadow-md font-sans w-full max-w-3xl mx-auto rounded-xs print:shadow-none print:border-none print:p-0 print:max-w-none print:text-black"
                style={{ minHeight: "297mm" }} // Standard A4 ratio feel container
            >
                {/* 1. Header Centered Block */}
                <div className="text-center space-y-1.5 mb-8 print:mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-950 print:text-black leading-tight">
                        {schoolName.charAt(0).toUpperCase() + schoolName.slice(1).toLowerCase() || "Unknown"}
                    </h1>
                    <p className="text-lg md:text-xl font-bold text-gray-900 print:text-black">
                        Subject: {subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase() || "Unknown"}
                    </p>
                    <p className="text-lg md:text-xl font-bold text-gray-900 print:text-black">
                        Class: {className || "Unknown"}
                    </p>
                </div>

                {/* 2. Horizontal Metadata Bar */}
                <div className="flex justify-between items-center text-sm md:text-base font-bold pb-3 pt-4 mb-2 select-none text-gray-950 print:text-black">
                    <span>
                        Time Allowed: {duration || "NA"}
                    </span>
                    <span>
                        Maximum Marks: {maximumMarks ?? 20}
                    </span>
                </div>

                {/* 3. Global Compulsory Statement */}
                <p className="text-sm md:text-base font-bold text-gray-950 print:text-black mb-6">
                    All questions are compulsory unless stated otherwise.
                </p>

                {/* 4. Student Segment with exact image underscores */}
                <div className="space-y-1 text-sm md:text-base font-bold text-gray-950 print:text-black mb-8 select-none leading-relaxed">
                    <div>
                        Name: ______________________
                    </div>
                    <div>
                        Roll Number: _________________
                    </div>
                    <div>
                        Class: {className || "Unknown"}
                    </div>
                </div>

                {/* 5. Sections and Questions Rendering */}
                {sections.map((sec, secIdx) => {
                    let globalIndex = 0;
                    // Count previous questions to render global index correctly
                    for (let s = 0; s < secIdx; s++) {
                        globalIndex += sections[s].questions.length;
                    }

                    return (
                        <div key={secIdx} className="mb-8 print:mb-6">
                            {/* Section Head Centered */}
                            <div className="text-center py-4 mb-3 print:py-2 select-none">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-950 print:text-black">
                                    {sec.title}
                                </h2>
                            </div>

                            {/* Sub-header instructions */}
                            <div className="mb-4 text-sm md:text-base select-none">
                                <p className="font-bold text-gray-950 print:text-black">
                                    {sec.questions[0]?.type === "multiple-choice" ? "Multiple Choice Questions" : "Short Answer Questions"}
                                </p>
                                <p className="italic text-gray-850 print:text-black text-xs md:text-sm mt-0.5">
                                    {sec.instructions || "Attempt all questions. Each question carries marks as stated."}
                                </p>
                            </div>

                            {/* Question Items */}
                            <div className="space-y-4 md:space-y-5 print:space-y-3.5">
                                {sec.questions.map((q, qIdx) => {
                                    const absoluteNum = globalIndex + qIdx + 1;
                                    const difficultyPrefix = `[${formatDifficulty(q.difficulty)}] `;
                                    const marksSuffix = ` [${q.marks} Mark${q.marks > 1 ? "s" : ""}]`;

                                    return (
                                        <div
                                            key={q.id}
                                            className={`group transition-all duration-200 p-1 rounded-sm cursor-pointer  print:hover:bg-transparent print:p-0 print:cursor-default`}
                                        >
                                            <div className="text-[15px] md:text-[16px] text-gray-950 print:text-black flex items-start leading-relaxed">
                                                {/* Left Number */}
                                                <span className="font-medium mr-2 shrink-0 select-none">
                                                    {absoluteNum}.
                                                </span>
                                                {/* Question Text */}
                                                <p className="flex-1 text-gray-950">
                                                    <span className="font-semibold text-gray-950 print:text-black">
                                                        {difficultyPrefix}
                                                    </span>
                                                    <span className="print:text-black text-gray-950">{q.question}</span>
                                                    <span className="font-semibold text-gray-950 print:text-black shrink-0 whitespace-nowrap ml-1">
                                                        {marksSuffix}
                                                    </span>
                                                </p>
                                            </div>

                                            {/* Rendering Multiple Choice options */}
                                            {q.type === "multiple-choice" && q.options && q.options.length > 0 && (
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pl-7 mt-2 text-sm md:text-base text-gray-900 print:text-black">
                                                    {q.options.map((opt, oIdx) => {
                                                        const optionLetter = String.fromCharCode(97 + oIdx); // a, b, c, d
                                                        return (
                                                            <div key={oIdx} className="flex gap-1.5 items-start">
                                                                <span className="font-semibold select-none">({optionLetter})</span>
                                                                <span>{opt}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}



                                            {/* Numerical / Work spacing helpers on digital screen to simulate real pages */}
                                            {q.type === "numerical" && (
                                                <div className="pl-7 mt-2 no-print select-none">
                                                    <div className="border border-dashed border-gray-200 bg-gray-50/20 text-[11px] text-gray-400 p-2 italic rounded-xs max-w-sm">
                                                        (Math numerical - Work space is provided when printed)
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* 6. Bold Footer Visual Break */}
                <p className="text-[15px] md:text-[16px] font-bold text-gray-950 print:text-black mt-10 mb-8 select-none">
                    End of Question Paper
                </p>

                {/* 7. Answer Key Block (Toggleable & perfect match to printed visual block) */}

                <div className="mt-12 font-sans text-gray-950 print:text-black select-all">
                    <h3 className="text-base md:text-lg font-bold text-gray-950 print:text-black mb-4 select-none">
                        Answer Key:
                    </h3>
                    <div className="space-y-3.5">
                        {answerKey && answerKey.map((ans, idx) => {
                            // Find matching question title for digital viewer convenience
                            const rawQuestion = sections
                                .flatMap((s) => s.questions)
                                .find((q) => q.id === ans.questionId);

                            return (
                                <div key={ans.questionId} className="text-[15px] md:text-[16px] flex items-start leading-relaxed text-gray-950 print:text-black">
                                    <span className="font-bold mr-2 shrink-0 select-none">
                                        {idx + 1}.
                                    </span>
                                    <div className="flex-1">
                                        {/* Digital display enhancement */}
                                        {rawQuestion && (
                                            <p className="text-[11px] text-gray-400 font-medium select-none no-print mb-0.5">
                                                Q: {rawQuestion.question.substring(0, 60)}...
                                            </p>
                                        )}
                                        <p className="text-gray-900 print:text-black font-normal leading-relaxed">
                                            {ans.answer}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

export default AssignmentDisplay
