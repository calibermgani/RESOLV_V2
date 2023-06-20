<?php

namespace Database\Seeders;

use App\Models\Error_type;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ErrorTypesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Error_type::truncate();

        DB::table('error_types')->insert(array (
            0 => array (
                    'id' => 1,
                    'name' => 'No Error',
                    'status' => 1,
                    'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                    'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                ),
            1 => array (
                    'id' => 2,
                    'name' => 'Error',
                    'status' => 1,
                    'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                    'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                ),
            2 => array (
                    'id' => 3,
                    'name' => 'FYI',
                    'status' => 1,
                    'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                    'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                ),
            3 => array (
                    'id' => 4,
                    'name' => 'Clarification',
                    'status' => 1,
                    'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                    'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
            ),
        ));
    }
}
