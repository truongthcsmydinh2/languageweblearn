/*
  Warnings:

  - The values [true_false,fill_blank,matching] on the enum `ielts_reading_questions_question_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `ielts_reading_questions` MODIFY `question_type` ENUM('multiple_choice', 'true_false_not_given', 'yes_no_not_given', 'matching_headings', 'matching_information', 'matching_features', 'matching_sentence_endings', 'sentence_completion', 'summary_completion', 'note_completion', 'table_completion', 'flow_chart_completion', 'diagram_labelling', 'short_answer_questions') NOT NULL;
