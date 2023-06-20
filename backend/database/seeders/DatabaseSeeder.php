<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            FollowupTemplatesTableSeeder::class,
            FollowupQuestionsTableSeeder::class,
            FollowupCategoriesTableSeeder::class,
            ActionTypesTableSeeder::class,
            ClaimStatesTableSeeder::class,
            RolesTableSeeder::class,
            StatusTableSeeder::class,
            ErrorTypesTableSeeder::class,
            ParentParametersTableSeeder::class,
            SubParametersTableSeeder::class
        ]);
    }
}
