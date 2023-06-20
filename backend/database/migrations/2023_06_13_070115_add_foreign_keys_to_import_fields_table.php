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
        Schema::table('import_fields', function (Blueprint $table) {
            $table->foreign('file_upload_id', 'fk_upload_id')->references('id')->on('file_uploads')->onUpdate('RESTRICT')->onDelete('RESTRICT');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('import_fields', function (Blueprint $table) {
            $table->dropForeign('fk_upload_id');
        });
    }
};
