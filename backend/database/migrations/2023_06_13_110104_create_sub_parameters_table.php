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
        Schema::create('sub_parameters', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('parent_id');
            $table->string('sub_parameter', 255);
            $table->integer('status');
            $table->integer('created_by');
            $table->integer('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('parent_parameters')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sub_parameters');
    }
};
