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
        Schema::create('process_notes', function (Blueprint $table) {
            $table->integer('id', true);
			$table->string('claim_id', 20);
			$table->enum('state', array('Active','Inactive','Edited'));
			$table->text('content', 65535);
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
        Schema::dropIfExists('process_notes');
    }
};
