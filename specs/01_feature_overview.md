## Overview

The main feature that we are working on is mainly a question answer mapping system via input pdf/image files.

How it works:

- A teacher uploads a question paper (pdf or image) and a student answers for the paper(pdf or image).
- The platform processes both the documents.
- A new screen appears with the questions on one side and answers on other side.
- The questions in the screen are ui list items generated from the questions parsed from the question paper pdf. Whereas the answers window show the actual pdf/images of the answers uploaded.
- If a teacher clicks on any question in questions window, the corresponding answer will be shown in the answers in the window highlighting the mapped answer present in the answers uploaded document.
- The questions list may also have an ai-predicted marks system for each question as (predicted score / maximum score), which can accumulate over the course of the paper for different sections and for the whole paper too.
- Special care should be taken about optional questions and their mapping and the mapping of nested questions like "Q3(a) OR Q4(b)".



## Technical Roadmap

- Since the uploaded documents can either be scanned or born digital, we use OCR models to parse the content instead of parser libraries for pdfs.
- We are using mistra AI OCR model for parsing the content from documents.
- Mistra AI OCR also supports blocks and coordinates parsing of the content. This could be very helpful especially in parsing answer documents because we need region highlighting there for selected question.
- The generated OCR may have inconsistencies and may be parsed having ambiguity, repetitions in the generated OCR output. Also one more problem is we cannot operate over the generated OCR content directly because different question papers and answer sheets may have different formats and hence different OCR output formats as well.
- Therefore, we use an llm to parse the generated OCR output and generate a structured output for the question paper and answer sheet. The OCR output is hence transformed to a pre specified JSON format by the llm and then we can operate over the generated JSON output.
- The OCR model can generate different OCR outputs even for same question papers if tried multiple times. This is something that we can't control much. But we can make sure that the generated JSON output is consistent for the same OCR output. Hence, the cache should be maintained correctly for the pair 'Generated OCR and Transformed JSON'. Note the cache is not for the pair 'Document (Question Paper or Answer Sheet) and Transformed JSON', It is for the pair 'Generated OCR and Transformed JSON'. This is because the OCR output can change even if the document is same, if the OCR is generated again.
- This cache should be invalidated when the OCR output changes even if the question paper is same but OCR is generated again.


## Question Paper Extraction Validation:

- Some checks are needed to validate the generated JSON output against the parsed OCR output (inventory).
- These checks are hand written and hard coded conditions in the validate.question-extraction.ts file.
- Mainly the checks are for the following:
    1. Block Existence: Question from the questions list by llm transformed JSON should have the block id that is already present in the block list of inventory.
    2. Question Existence: Question content from each question from the transformed LLM output should be there in the specified block content from the inventory.
    3. Section Structure: Matched with number of questions in each section, marks of each question and total marks of each section.


## Region highlighting: (for answers)

- For region highlighting, we need the coordinates of blocks from the OCR output. The OCR output may contain overlapped content in blocks. Also sometimes the blocks are not properly distinct, like multiple questions can be in the same block in the generated OCR.
- We cannot give these blocks or coordinates to the LLM too because it will hallucinate them.
- Therefore, we will need custom checks and math operations to get the appropriate coordinates and distinction of blocks and reliable region highlighting.
- The coordinates/positions of the blocks are never fed to LLMs, they are always stored in the code.


## AI score:

- For each evalauated answer, we need an ai score for it.
- One way to do it is, give each evaluated question-answer pair to a mini llm and get the score.
- But the number of calls would increase a lot with this. A question paper with 30 questions would need 30 calls.
- Another extreme is to give all the evaluated question-answers pair to the llm in one pass and get the scores. But there are very chances for a mini model to get confused and hallucinate over the response with the order, marking scheme, reviewing score etc.
- A good way can be to give the question-answers pair to the llm in a batch and get the scores and then calculate the final score. Even if we decide to give 12 questions to the llm at a time, the number of calls will be 3 for a 30 question paper.
- Maxium papers could get evaluated in a single call with a good batch size. That way, we can reduce the llm calls and get a reliable output too.
- The llm should be expected to return the numeric score for each question, and a one liner review/comment for each reviewed answer. The review statement should strictly be of 2 lines max, not more than that. A failed review can have the statement as "AI failed to review this answer".
- The resolved answers should show the reviewed scores along with respective question in the questions list. While the unattempted/unresolved answers should say "-" instead of 0.