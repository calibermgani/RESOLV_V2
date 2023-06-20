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
        Schema::create('insurances', function (Blueprint $table) {
            $table->integer('id', true);
			$table->string('ins_name', 100);
			$table->enum('ins_type', array('Primary','Secondary','Tertiary','Others'));
			$table->string('policy_id', 20);
			$table->string('group_id', 20);
			$table->string('ins_address_line_1', 100);
			$table->string('ins_address_line_2', 100);
			$table->string('ins_city', 20);
			$table->string('ins_state', 20);
			$table->string('ins_zipcode', 10);
			$table->integer('ins_phone_no');
			$table->string('ins_auth', 20);
			$table->timestamps();
			$table->bigInteger('created_by')->index('fk_user_ins_created');
			$table->bigInteger('updated_by')->index('fk_user_ins_updated');
			$table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('insurances');
    }
};
