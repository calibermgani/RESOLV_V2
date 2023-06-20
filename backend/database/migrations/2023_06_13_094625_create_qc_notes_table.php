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
        Schema::create('qc_notes', function (Blueprint $table) {
            $table->integer('id', true);
			$table->string('claim_id', 20);
			$table->enum('state', array('Active','Inactive','Edited'));
			$table->text('content', 65535);
			$table->timestamps();
			$table->bigInteger('created_by');
			$table->bigInteger('updated_by')->nullable();
			$table->softDeletes();
			$table->integer('root_cause')->nullable();
			$table->text('error_type', 65535)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('qc_notes');
    }
};
