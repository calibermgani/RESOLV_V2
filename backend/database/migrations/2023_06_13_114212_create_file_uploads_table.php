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
        Schema::create('file_uploads', function (Blueprint $table) {
            $table->integer('id', true);
            $table->dateTime('report_date');
            $table->string('file_name', 100);
            $table->text('unique_name');
            $table->string('file_url', 200);
            $table->string('notes', 500);
            $table->integer('total_claims');
            $table->integer('new_claims');
            $table->bigInteger('Import_by')->index('fk_user_fileupld');
            $table->integer('claims_processed');
            $table->enum('status', array('Complete', 'Incomplete'));
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('file_uploads');
    }
};
