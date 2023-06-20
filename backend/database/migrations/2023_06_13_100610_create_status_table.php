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
        Schema::create('status', function (Blueprint $table) {
            $table->integer('id', true);
			$table->string('status_code', 20);
			$table->text('description', 65535);
			$table->integer('status');
			$table->timestamps();
			$table->bigInteger('created_by');
			$table->bigInteger('updated_by')->nullable();
			$table->softDeletes();
			$table->text('modules', 65535)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('status');
    }
};
