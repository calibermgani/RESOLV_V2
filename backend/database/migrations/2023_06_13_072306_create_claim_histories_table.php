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
        Schema::create('claim_histories', function (Blueprint $table) {
            $table->integer('id', true);
			$table->string('claim_id', 20);
			$table->integer('claim_state')->index('claim_state');
			$table->integer('assigned_by')->nullable();
			$table->integer('assigned_to')->nullable();
			$table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claim_histories');
    }
};
