"use client";

import React, { useEffect } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { useAssignmentStore } from '../../../store/assignments.store';
import { convertDatetoString } from '../../../utils/functions/convertDatetoString';

function AssignmentCard({
    name = "Assignment Name",
    assignedOn = "2023-01-01",
    dueDate = "2023-02-01",
}) {
    return (
        <div className="flex flex-col min-h-32 bg-white shadow-md justify-between p-3 px-5 rounded-xl min-w-lg">
            <div className="flex items-center justify-between">
                <h2 className={"font-bold text-xl"}>{name}</h2>

                <span className='font-normal text-gray-500 cursor-pointer'>
                    <EllipsisVertical size={18} />
                </span>
            </div>

            <div className="flex items-center justify-between">
                <p className='text-sm font-bold'>
                    Assigned On:
                    <span className='opacity-60 font-light ml-1'>
                        {assignedOn}
                    </span>
                </p>

                <p className='text-sm font-bold'>
                    Due:
                    <span className='opacity-60 font-light ml-1'>
                        {convertDatetoString(new Date(dueDate))}
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
    } = useAssignmentStore();

    useEffect(() => {
        useAssignmentStore.getState().fetchAssignments();
    }, []);

    if (loading) {
        return <p>Loading assignments...</p>;
    }

    if((!loading && !assignments.length) || (!loading && assignments.length === 0)) {
        return <p>No assignments found</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div className='flex flex-wrap gap-6 items-center justify-center my-4'>
            {
                assignments.map((assignment) => {
                    return (
                        <div key={assignment._id}>
                            <AssignmentCard
                                name={assignment.assignmentName}
                                assignedOn={"20-01-2023"}
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