<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('qc_notes', function (Blueprint $table) {
            $table->integer('error_parameter')->nullable()->after('root_cause');
            $table->integer('error_sub_parameter')->nullable()->after('error_parameter');
            $table->integer('fyi_parameter')->nullable()->after('error_sub_parameter');
            $table->integer('fyi_sub_parameter')->nullable()->after('fyi_parameter');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('qc_notes', function (Blueprint $table) {
            $table->dropColumn('error_parameter');
            $table->dropColumn('error_sub_parameter');
            $table->dropColumn('fyi_parameter');
            $table->dropColumn('fyi_sub_parameter');
        });
    }
};
