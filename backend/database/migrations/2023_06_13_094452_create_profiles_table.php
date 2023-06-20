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
        Schema::create('profiles', function (Blueprint $table) {
            $table->bigInteger('id', true);
			$table->bigInteger('user_id')->index('fk_user_profile');
			$table->string('employee_code', 10);
			$table->date('dob');
			$table->enum('gender', array('Male','Female','Others'));
			$table->string('mobile_phone', 15);
			$table->string('work_phone', 15);
			$table->integer('address_flag_id')->index('fk_user_addressflag');
			$table->text('image', 65535)->nullable();
			$table->timestamps();
			$table->bigInteger('created_by');
			$table->bigInteger('updated_by');
			$table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
