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
        Schema::create('address_flags', function (Blueprint $table) {
            $table->integer('id', true);
			$table->enum('address_company', array('usps'));
			$table->enum('type', array('patients','users'));
			$table->string('address_line_1', 25);
			$table->string('address_line_2', 25);
			$table->string('city', 25);
			$table->string('state', 20);
			$table->integer('zip5');
			$table->integer('zip4');
			$table->enum('is_address_match', array('Yes','No'));
			$table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('address_flags');
    }
};
