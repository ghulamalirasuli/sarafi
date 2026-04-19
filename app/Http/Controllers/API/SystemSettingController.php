<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SystemSettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = SystemSetting::first() ?? new SystemSetting();
        return response()->json($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'system_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'logo' => 'nullable|image|max:2048',
        ]);

        $settings = SystemSetting::first() ?? new SystemSetting();
        
        $data = $request->only(['system_name', 'email', 'phone', 'address']);

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($settings->logo_path) {
                Storage::disk('public')->delete($settings->logo_path);
            }
            $data['logo_path'] = $request->file('logo')->store('system', 'public');
        }

        $settings->fill($data);
        $settings->save();

        return response()->json($settings->fresh());
    }
}
