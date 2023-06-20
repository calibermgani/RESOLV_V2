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
        Schema::create('actions', function (Blueprint $table) {
            $table->integer('id', true);
			$table->string('claim_id', 20)->nullable()->index('fk_claim_action');
			$table->string('action_type', 20)->nullable();
			$table->integer('action_id')->nullable();
			$table->bigInteger('assigned_to')->index('fk_user_action_create');
			$table->bigInteger('assigned_by')->index('fk_user_action_update');
			$table->string('status', 10);
			$table->timestamps();
			$table->bigInteger('created_by');
			$table->bigInteger('updated_by')->nullable();
			$table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actions');
    }
};
