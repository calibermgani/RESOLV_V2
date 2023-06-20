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
        Schema::create('practices', function (Blueprint $table) {
            $table->integer('id', true);
			$table->string('practice_name', 20);
			$table->string('practice_description', 100);
			$table->string('email', 50);
			$table->string('phone', 15);
			$table->string('fax', 15);
			$table->string('avatar_name', 100);
			$table->string('practice_link', 100);
			$table->string('doing_business_as', 100);
			$table->string('speciality_id', 20);
			$table->string('taxanomy_id', 20);
			$table->enum('billing_entity', array('Yes','No'));
			$table->enum('entity_type', array('Individual','Group'));
			$table->string('tax_id', 20);
			$table->string('group_tax_id', 20);
			$table->string('npi', 20);
			$table->string('group_npi', 20);
			$table->string('medicare_ptan', 20);
			$table->string('medicaid', 20);
			$table->string('mail_add_1', 100);
			$table->string('mail_add_2', 100);
			$table->string('mail_city', 20);
			$table->string('mail_state', 20);
			$table->string('mail_zip5', 10);
			$table->string('mail_zip4', 10);
			$table->string('primary_add_1', 100);
			$table->string('primary_add_2', 100);
			$table->string('primary_city', 20);
			$table->string('primary_state', 20);
			$table->string('primary_zip5', 10);
			$table->string('primary_zip4', 10);
			$table->string('practice_db_id', 20);
			$table->enum('status', array('Active','Inactive'));
			$table->timestamps();
			$table->bigInteger('created_by')->index('fk_user_practice_create');
			$table->bigInteger('updated_by')->nullable()->index('fk_user_practice_update');
			$table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('practices');
    }
};
