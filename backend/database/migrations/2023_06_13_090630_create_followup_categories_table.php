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
        Schema::create('followup_categories', function (Blueprint $table) {
            $table->integer('id', true);
			$table->string('name', 120);
			$table->string('label_name', 120);
			$table->enum('status', array('Active','Inactive'));
			$table->integer('created_by');
			$table->integer('updated_by')->nullable();
            $table->timestamps();
			$table->softDeletes();
			$table->integer('deleted_by')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('followup_categories');
    }
};
