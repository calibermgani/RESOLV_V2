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
        Schema::create('notes', function (Blueprint $table) {
            $table->integer('id', true);
			$table->integer('claim_id')->index('fk_claim_notes');
			$table->string('notes', 100);
			$table->enum('notes_type', array('Claim','Action','Process','Followup'));
			$table->bigInteger('user')->index('fk_user_notes');
			$table->timestamps();
			$table->bigInteger('created_by')->index('fk_user_notes_created');
			$table->bigInteger('updated_by')->index('fk_user_notes_updated');
			$table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
