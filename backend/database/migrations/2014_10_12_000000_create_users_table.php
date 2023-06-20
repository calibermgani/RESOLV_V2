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
        Schema::create('users', function (Blueprint $table) {
            $table->bigInteger('id')->primary();
			$table->integer('role_id')->index('fk_roleid');
			$table->string('user_name', 50);
			$table->string('email', 100);
			$table->string('password', 60);
			$table->enum('user_type', array('Practice','Medcubics'));
			$table->dateTime('last_login');
			$table->string('firstname', 100);
			$table->string('lastname', 100);
			$table->enum('status', array('Active','Inactive'));
			$table->string('token', 250);
			$table->enum('is_logged_in', array('0','1'));
			$table->integer('login_attempt');
			$table->dateTime('attempt_updated');
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
        Schema::dropIfExists('users');
    }
};
