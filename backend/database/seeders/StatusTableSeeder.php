<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StatusTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('status')->delete();

        DB::table('status')->insert(array(
            0 =>
            array(
                'id' => 1,
                'status_code' => 'CA',
                'description' => 'Client Assistance',
                'status' => 1,
                'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'created_by' => 26,
                'updated_by' => NULL,
                'deleted_at' => NULL,
                'modules' => '{"followup":true,"audit":true,"ca":true,"rcm":true}',
            ),
            1 =>
            array(
                'id' => 2,
                'status_code' => 'RCM',
                'description' => 'RCM Team',
                'status' => 1,
                'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'created_by' => 26,
                'updated_by' => NULL,
                'deleted_at' => NULL,
                'modules' => '{"followup":true,"audit":true,"ca":true,"rcm":true}',
            ),

        ));
    }
}
