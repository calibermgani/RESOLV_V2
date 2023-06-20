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
        Schema::table('claim_histories', function (Blueprint $table) {
            $table->foreign('claim_state', 'claim_state')->references('id')->on('claim_states')->onUpdate('RESTRICT')->onDelete('RESTRICT');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('claim_histories', function (Blueprint $table) {
            $table->dropForeign('claim_state');
        });
    }
};
