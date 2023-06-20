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
        Schema::create('claim_infos', function (Blueprint $table) {
            $table->integer('id', true);
			$table->string('claim_number', 20);
			$table->integer('patient_id')->nullable()->index('fk_patient_claim');
			$table->integer('primary_ins_id')->nullable()->index('fk_insurance_claim');
			$table->integer('secondary_ins_id')->nullable()->index('fk_insurance_claim_sec');
			$table->integer('tertiary_ins_id')->nullable()->index('fk_insurance_claim_ter');
			$table->string('rendering_provider', 50);
			$table->string('billing_provider', 50);
			$table->string('facility', 50);
			$table->dateTime('dos_from');
			$table->dateTime('dos_to');
			$table->dateTime('admit_date');
			$table->dateTime('discharge_date');
			$table->string('cpt', 10);
			$table->string('icd', 100);
			$table->string('modifier', 100);
			$table->float('units', 10, 0);
			$table->float('total_charges', 10, 0);
			$table->float('pat_ar', 10, 0);
			$table->float('ins_ar', 10, 0);
			$table->float('total_ar_due', 10, 0);
			$table->integer('claim_status')->index('fk_status_claim');
			$table->integer('claim_sub_status')->index('fk_status_claim_sub_sts');
			$table->string('responsibility', 20);
			$table->timestamps();
			$table->bigInteger('created_by')->index('fk_user_claim_created');
			$table->bigInteger('updated_by')->index('fk_user_claim_updated');
			$table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claim_infos');
    }
};
