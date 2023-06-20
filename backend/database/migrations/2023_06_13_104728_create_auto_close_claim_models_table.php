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
        Schema::create('auto_close_claim_models', function (Blueprint $table) {
            $table->increments('id');
            $table->string('claim_no',100);
            $table->string('acct_no',50);
            $table->bigInteger('import_by');
            $table->string('file_name');
            $table->string('file_url');
            $table->date('auto_close_date');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auto_close_claim_models');
    }
};
