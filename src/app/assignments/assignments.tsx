import React from 'react';


const assignmentsList = [
    {
        id: 1,
        name: "React JS",
        assignedOn: "2023-01-01",
        dueDate: "2023-02-01",
    },
    {
        id: 2,
        name: "Next JS",
        assignedOn: "2023-01-01",
        dueDate: "2023-02-01",
    },
    {
        id: 3,
        name: "Node JS",
        assignedOn: "2023-01-01",
        dueDate: "2023-02-01",
    },
    {
        id: 4,
        name: "Mongo DB",
        assignedOn: "2023-01-01",
        dueDate: "2023-02-01",
    }
]

function assignmentCard({
    name = "Assignment Name", 
    assignedOn = "2023-01-01", 
    dueDate = "2023-02-01",
}) {
    return (
        <div className="flex flex-col p-2">
            <div>
                <h2>{name}</h2>
            </div>
            <div className="flex items-center justify-between">
                <p><span className="font-bold">Assigned On: </span>{assignedOn}</p>
                <p><span className="font-bold">Due: </span>{dueDate}</p>
            </div>
        </div>
    )
}

function assignments() {



  return (
    <div>
      {}
    </div>
  )
}

export default assignments
