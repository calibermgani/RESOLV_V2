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
        Schema::create('f_y_i_parameters', function (Blueprint $table) {
            $table->increments('id');
            $table->string('fyi_parameter',50);
            $table->string('fyi_sub_parameter',50);
            $table->integer('status');
            $table->integer('created_by');
			$table->integer('updated_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('f_y_i_parameters');
    }
};
