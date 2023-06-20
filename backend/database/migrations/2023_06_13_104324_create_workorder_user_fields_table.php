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
        Schema::create('workorder_user_fields', function (Blueprint $table) {
            $table->integer('id', true);
			$table->integer('work_order_id');
			$table->integer('user_id');
			$table->text('cliam_no', 65535);
			$table->text('completed_claim', 65535)->nullable();
			$table->timestamps();
			$table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workorder_user_fields');
    }
};
