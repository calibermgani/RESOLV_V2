<?php

namespace Database\Seeders;

use App\Models\Followup_question;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FollowupQuestionsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Followup_question::truncate();

        DB::table('followup_questions')->insert(array (
            0 =>
            array (
                'id' => 1,
                'question' => 'What\'s the effective date of policy?',
                'question_label' => 'What_s_the_effective_date_of_policy_',
                'hint' => 'EOD Policy',
                'category_id' => 1,
                'field_type' => 'Date',
                'field_validation' => NULL,
                'date_type' => 'single_date',
                'status' => 'Active',
                'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'created_by' => 26,
                'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'deleted_at' => NULL,
            ),
            1 =>
            array (
                'id' => 2,
                'question' => 'What\'s the filing limit?',
                'question_label' => 'What_s_the_filing_limit_',
                'hint' => 'Filing Limit',
                'category_id' => 1,
                'field_type' => 'Number',
                'field_validation' => 'Number',
                'date_type' => NULL,
                'status' => 'Active',
                'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'created_by' => 26,
                'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'deleted_at' => NULL,
            ),
        ));
    }
}
