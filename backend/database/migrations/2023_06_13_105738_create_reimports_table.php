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
        Schema::create('reimports', function (Blueprint $table) {
            $table->increments('id');
            $table->dateTime('report_date');
            $table->string('file_name');
			$table->text('unique_name');
			$table->string('file_url');
			$table->string('notes', 500);
			$table->integer('total_claims');
			$table->bigInteger('reimport_by');
			$table->integer('claims_processed');
			$table->enum('status', array('Complete','Incomplete'))->default('Incomplete');
			$table->timestamps();
			$table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reimports');
    }
};
