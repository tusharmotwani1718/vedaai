"use client";

import React, { useEffect } from 'react';
import { EllipsisVertical, Trash2, Eye, Sparkles, Plus } from 'lucide-react';
import { useAssignmentStore } from '../../../../store/assignments.store';
import { convertDatetoString } from '../../../../utils/functions/convertDatetoString';
import { Loader } from "../../../_components/utils/loader";
import { Dropdown, Space } from 'antd';
import Link from 'next/link';
import Image from "next/image"
import SidebarButton from '@/_components/utils/SidebarButton';

function AssignmentCard({
    _id,
    name = "Assignment Name",
    dueDate = "2023-02-01",
    status = "pending",
    onDelete,
}: {
    _id: string;
    name: string;
    dueDate: string;
    status: "pending" | "completed" | "failed";
    onDelete?: (id: string) => void;
}) {
    // Helper to render title with underline on the keyword "Quiz" to match screenshots exactly
    const renderTitle = (titleText: string) => {
        if (titleText.startsWith("Quiz")) {
            return (
                <span>
                    <span className="underline decoration-1 decoration-gray-400 underline-offset-4 pointer-events-none">Quiz</span>
                    {titleText.slice(4)}
                </span>
            );
        }
        return titleText;
    };

    // Format any date to DD-MM-YYYY format
    const formatToDDMMYYYY = (dateStr: string) => {
        if (!dateStr) return '';
        // If already formatted (contains dashes with first token as day)
        if (dateStr.includes('-') && dateStr.split('-')[0].length <= 2) {
            return dateStr;
        }
        try {
            const dateObj = new Date(dateStr);
            if (isNaN(dateObj.getTime())) return dateStr;
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            return day + "-" + month + "-" + year;
        } catch {
            return dateStr;
        }
    };

    const items = [
        {
            label: (
                <Link href={`/assignments/view-assignment/${_id}`}>
                    <span className="flex items-center gap-2 font-sans py-1.5 px-1 text-xs">
                        <Eye size={14} className="text-gray-400" />
                        <span>View</span>
                    </span>
                </Link>
            ),
            key: 'view',
        },
        // {
        //     label: (
        //         <span className="flex items-center gap-2 font-sans py-1.5 px-1 text-xs font-semibold">
        //             <Trash2 size={14} />
        //             <span>Delete</span>
        //         </span>
        //     ),
        //     key: 'delete',
        //     danger: true,
        //     onClick: () => onDelete && onDelete(_id),
        // },
    ];

    const getStatusIndicator = () => {
        switch (status) {
            case 'completed':
                return { bg: 'bg-emerald-500', label: 'Completed' };
            case 'failed':
                return { bg: 'bg-rose-500', label: 'Failed' };
            default:
                return { bg: 'bg-amber-500', label: 'Pending' };
        }
    };

    const statusTheme = getStatusIndicator();

    return (
        <div className={`w-full md:min-w-137.5 bg-white rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_45px_rgba(0,0,0,0.06)] border border-gray-100/10 p-7 pb-8 px-8 flex flex-col justify-between transition-all duration-300 min-h-37 ${status == "pending" ? "cursor-not-allowed opacity-55 bg-gray-300 pointer-events-none" : ""}`}>
            {/* Top row: Title and Menu */}
            <div className="flex items-start justify-between">
                <div className="flex flex-col">
                    <h2 className="font-sans font-bold text-[22px] tracking-tight text-gray-900 leading-tight">
                        {renderTitle(name)}
                    </h2>
                    {/* Compact visual status representation to keep cards aligned, yet preserve metadata */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={"w-2 h-2 rounded-full " + statusTheme.bg} />
                        <span className="text-[11px] font-semibold text-gray-400 capitalize">
                            {statusTheme.label}
                        </span>
                    </div>
                </div>

                <Dropdown menu={{ items }} trigger={['click']} styles={{
                    root: {
                        minWidth: "140px"
                    }
                }}>
                    <button className="text-gray-400 hover:text-gray-700 hover:bg-gray-50 p-1.5 rounded-full transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-50" disabled={status == "pending"}>
                        <EllipsisVertical size={20} />
                    </button>
                </Dropdown>
            </div>

            <div className="flex items-center justify-between mt-8">

                {/* Right: Due Date */}
                <p className="text-[13.5px] font-semibold text-gray-900 font-sans tracking-tight">
                    {"Due : "}
                    <span className="text-gray-500 font-normal ml-0.5">
                        {formatToDDMMYYYY(dueDate)}
                    </span>
                </p>
            </div>
        </div>
    );
}

function Assignments() {

    const {
        assignments,
        loading,
        error,
        isInitialized
    } = useAssignmentStore();

    useEffect(() => {
        useAssignmentStore.getState().fetchAssignments();
    }, []);

    if (loading) {
        return (
            <div className='w-full flex items-center justify-center h-screen'>
                <Loader />
            </div>
        );
    }

    if (
        isInitialized &&
        !loading &&
        !assignments.length
    ) {
        return (
            <div className='flex flex-col h-[70vh] items-center justify-center gap-4'>
                <Image
                    src={'/illustrations/noItems.svg'}
                    alt="No Assignments"
                    width={300}
                    height={300}
                />
                <h1 className="text-3xl font-bold text-gray-900">
                    No Assignments Found
                </h1>
                <Link href={'/assignments/create-assignment'}>
                    <button
                        className={`w-68 cursor-pointer transition-opacity hover:opacity-90 active:opacity-80 rounded-3xl flex items-center gap-3 justify-center bg-gray-950`}
                        style={{
                            padding: '10px 16px',
                            color: '#ffffff',
                            fontSize: 16,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <Plus />
                        Create First Assignment
                    </button>
                </Link>
            </div>
        );
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div className='flex flex-wrap gap-4 items-center justify-center'>
            {
                assignments.map((assignment) => {
                    return (
                        <div key={assignment._id}>
                            <AssignmentCard
                                _id={assignment._id}
                                name={assignment.assignmentName}
                                status={assignment.status}
                                dueDate={assignment.dueDate.toString()}
                            />
                        </div>
                    )
                })
            }
        </div>
    );
}

export default Assignments;