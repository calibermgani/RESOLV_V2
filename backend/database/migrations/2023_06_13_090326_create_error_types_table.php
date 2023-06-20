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
        Schema::create('error_types', function (Blueprint $table) {
            $table->integer('id', true);
			$table->string('name', 20);
			$table->integer('status');
			$table->integer('created_by');
			$table->integer('updated_by')->nullable();
			$table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('error_types');
    }
};
