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
        Schema::create('followup_questions', function (Blueprint $table) {
            $table->integer('id', true);
			$table->text('question', 65535);
			$table->text('question_label', 65535);
			$table->string('hint', 120);
			$table->integer('category_id');
			$table->enum('field_type', array('Date','Number','Text'));
			$table->enum('field_validation', array('Number','Text','Both'))->nullable();
			$table->enum('date_type', array('single_date','double_date'))->nullable();
			$table->enum('status', array('Active','Inactive'));
			$table->timestamps();
			$table->integer('created_by')->nullable();
			$table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('followup_questions');
    }
};
