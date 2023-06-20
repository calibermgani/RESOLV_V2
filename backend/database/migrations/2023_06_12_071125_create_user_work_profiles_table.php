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
        Schema::create('user_work_profiles', function (Blueprint $table) {
            $table->integer('id', true);
			$table->string('user_id', 20);
			$table->integer('claim_assign_limit');
			$table->integer('caller_benchmark')->nullable();
			$table->integer('role_id');
			$table->integer('created_by');
			$table->integer('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_work_profiles');
    }
};
