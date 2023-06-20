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
        Schema::create('modules', function (Blueprint $table) {
            $table->integer('id', true);
			$table->string('module_name', 20);
			$table->integer('parent_module_id')->index('fk_module_module');
			$table->timestamps();
			$table->bigInteger('created_by')->index('fk_user_module_create');
			$table->bigInteger('updated_by')->index('fk_user_module_update');
			$table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('modules');
    }
};
