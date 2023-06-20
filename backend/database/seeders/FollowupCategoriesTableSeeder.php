<?php

namespace Database\Seeders;

use App\Models\Followup_category;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FollowupCategoriesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Followup_category::truncate();

        DB::table('followup_categories')->insert(array (
            0 =>
            array (
                'id' => 1,
                'name' => 'Claim NIS',
                'label_name' => 'Claim NIS',
                'status' => 'Active',
                'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'created_by' => 26,
                'updated_by' => NULL,
                'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'deleted_at' => NULL,
                'deleted_by' => NULL,
            ),
        ));
    }
}
