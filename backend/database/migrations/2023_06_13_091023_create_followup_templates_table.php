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
        Schema::create('followup_templates', function (Blueprint $table) {
            $table->integer('id', true);
			$table->string('claim_id', 20);
			$table->string('rep_name', 50);
			$table->date('date');
			$table->string('phone', 15);
			$table->integer('insurance_id');
			$table->integer('category_id');
			$table->text('content', 65535);
			$table->integer('created_by');
			$table->timestamps();
			$table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('followup_templates');
    }
};
