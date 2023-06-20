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
        Schema::create('root_causes', function (Blueprint $table) {
            $table->integer('id', true);
			$table->string('name', 20);
			$table->integer('status');
			$table->timestamps();
			$table->integer('created_by');
			$table->integer('updated_by')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('root_causes');
    }
};
