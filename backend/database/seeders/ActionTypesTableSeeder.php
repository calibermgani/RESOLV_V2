<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ActionTypesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('action_types')->delete();

        DB::table('action_types')->insert(array (
            0 =>
            array (
                'id' => 1,
                'name' => 'Followup',
                'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'created_by' => NULL,
                'updated_at' => NULL,
                'deleted_at' => NULL,
            ),
            1 =>
            array (
                'id' => 2,
                'name' => 'Audit',
                'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'created_by' => NULL,
                'updated_at' => NULL,
                'deleted_at' => NULL,
            ),
        ));
    }
}
