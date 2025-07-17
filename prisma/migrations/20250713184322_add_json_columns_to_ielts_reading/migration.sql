-- AlterTable
ALTER TABLE `ielts_reading_passages` ADD COLUMN `passage_data` JSON NULL,
    ADD COLUMN `summary` JSON NULL;

-- AlterTable
ALTER TABLE `ielts_reading_questions` MODIFY `question_type` ENUM('multiple_choice', 'multiple_choice_5', 'multiple_choice_group', 'true_false_not_given', 'yes_no_not_given', 'matching_headings', 'matching_information', 'matching_features', 'matching_sentence_endings', 'sentence_completion', 'summary_completion', 'note_completion', 'table_completion', 'flow_chart_completion', 'diagram_labelling', 'short_answer_questions') NOT NULL;
