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
        Schema::create('workorder_fields', function (Blueprint $table) {
            $table->integer('id', true);
			$table->integer('work_order_type');
			$table->string('work_order_name', 30);
			$table->date('due_date');
			$table->string('status', 20);
			$table->string('priority', 20);
			$table->text('work_notes', 65535);
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
        Schema::dropIfExists('workorder_fields');
    }
};
