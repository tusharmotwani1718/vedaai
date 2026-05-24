"use client";
import React from 'react';
import AssignmentForm from "../../../_components/assignments/AssignmentForm"
import {AssignmentFormValues} from "../../../../types/assignment-form-types"

function page() {


  const onSubmitForm = (data: AssignmentFormValues) => {
    console.log(data);
  }

  return (
    <div>
      <AssignmentForm  />
    </div>
  )
}

export default page;
