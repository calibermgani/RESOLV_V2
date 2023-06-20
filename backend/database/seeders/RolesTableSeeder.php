<?php

namespace Database\Seeders;

use App\Models\Role;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Role::truncate();

        DB::table('roles')->insert(array(
            0 =>
            array(
                'id' => 1,
                'role_name' => 'AR Executive',
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 1,
                'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'deleted_at' => NULL,
            ),
            1 =>
            array(
                'id' => 2,
                'role_name' => 'TL / Group Coordinator',
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 1,
                'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'deleted_at' => NULL,
            ),
            2 =>
            array(
                'id' => 3,
                'role_name' => 'AM and Managers',
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 1,
                'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'deleted_at' => NULL,
            ),
            3 =>
            array(
                'id' => 4,
                'role_name' => 'Auditor',
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 1,
                'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'deleted_at' => NULL,
            ),
            4 =>
            array(
                'id' => 5,
                'role_name' => 'Administrator',
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 1,
                'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'deleted_at' => NULL,
            ),
            5 =>
            array(
                'id' => 6,
                'role_name' => 'QC User ',
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 1,
                'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'deleted_at' => NULL,
            ),
            6 =>
            array(
                'id' => 7,
                'role_name' => 'RCM Team',
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 1,
                'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'updated_at' => Carbon::now()->format('Y-m-d H:i:s'),
                'deleted_at' => NULL,
            ),
        ));
    }
}
