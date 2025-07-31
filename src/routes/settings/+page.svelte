<script lang="ts">
    let formData = {
      username: '',
      about: '',
      name: '',
      email: '',
      country: 'United States',
      streetAddress: '',
      city: '',
      region: '',
      postalCode: '',
      project: true,
      activity: false,
      mitra: false,
      pilihRole: 'admin'
    };
  
    // State baru untuk mengontrol tab aktif
    let activeTab: 'profile' | 'keamanan' = 'profile'; // Default ke 'profile'
  
    function handleSubmit(event: Event) {
      event.preventDefault();
      console.log('Form submitted:', formData);
      // Here you would typically send the data to your backend
    }
  
    function handleCancel() {
      // Reset form or navigate away
      console.log('Form cancelled');
    }
  </script>
  
  <svelte:head>
    <title>Settings - Indogreen</title>
  </svelte:head>
  
  <div class="max-w-1xl">
    <div class="p-1 bg-gray-200 rounded-lg inline-flex mb-4" role="tablist">
      <button
        on:click={() => (activeTab = 'profile')}
        class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
        class:bg-white={activeTab === 'profile'}
        class:shadow={activeTab === 'profile'}
        class:text-gray-600={activeTab !== 'profile'}
        role="tab"
        aria-selected={activeTab === 'profile'}
        aria-controls="panel-profile"
        id="tab-profile"
      >
        Profile
      </button>
      <button
        on:click={() => (activeTab = 'keamanan')}
        class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
        class:bg-white={activeTab === 'keamanan'}
        class:shadow={activeTab === 'keamanan'}
        class:text-gray-600={activeTab !== 'keamanan'}
        role="tab"
        aria-selected={activeTab === 'keamanan'}
        aria-controls="panel-keamanan"
        id="tab-keamanan"
      >
        Keamanan
      </button>
    </div>
    <form on:submit={handleSubmit}>
      {#if activeTab === 'profile'}
        <div id="panel-profile" role="tabpanel" aria-labelledby="tab-profile">
          <div class="bg-white space-y-12 py-8 px-4 rounded-lg sm:px-6 lg:px-8">
            <div class="border-b border-gray-900/10 pb-12">
              <h2 class="text-base/7 font-semibold text-gray-900">Personal Information</h2>
              <p class="mt-1 text-sm/6 text-gray-600">Kelola informasi data pribadi kamu.</p>
  
              <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div class="sm:col-span-4">
                  <label for="name" class="block text-sm/6 font-medium text-gray-900">Name</label>
                  <div class="mt-2">
                    <input 
                      id="name" 
                      type="text" 
                      bind:value={formData.name}
                      autocomplete="given-name" 
                      class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" 
                    />
                  </div>
                </div>
  
                <div class="sm:col-span-4">
                  <label for="email" class="block text-sm/6 font-medium text-gray-900">Email address</label>
                  <div class="mt-2">
                    <input 
                      id="email" 
                      type="email" 
                      bind:value={formData.email}
                      autocomplete="email" 
                      class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
  
      {#if activeTab === 'keamanan'}
        <div id="panel-keamanan" role="tabpanel" aria-labelledby="tab-keamanan">
          <div class="bg-white space-y-12 py-8 px-4 rounded-lg sm:px-6 lg:px-8">
            <div class="border-b border-gray-900/10 pb-12">
              <h2 class="text-base/7 font-semibold text-gray-900">Role</h2>
              <p class="mt-1 text-sm/6 text-gray-600">Role kamu adalah Admin.</p>
  
              <div class="mt-10 sm:col-span-2">
                <label for="country" class="block text-sm/6 font-medium text-gray-900">Pilih User</label>
                <div class="mt-2 grid grid-cols-1">
                  <select 
                    id="country" 
                    bind:value={formData.country}
                    autocomplete="country-name" 
                    class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  >
                    <option>United States</option>
                    <option>Canada</option>
                    <option>Mexico</option>
                    <option>Indonesia</option>
                  </select>
                  <svg viewBox="0 0 16 16" fill="currentColor" data-slot="icon" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4">
                    <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
                  </svg>
                </div>
              </div>
  
              <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  <fieldset class="sm:col-span-3">
                    <legend class="text-sm/6 font-semibold text-gray-900">Pilih Role</legend>
                    <div class="mt-6 space-y-3">
                      <div class="flex items-center gap-x-3">
                        <input 
                          id="push-admin" 
                          type="radio" 
                          bind:group={formData.pilihRole}
                          value="admin"
                          class="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden" 
                        />
                        <label for="push-admin" class="block text-sm/6 font-medium text-gray-900">Admin</label>
                      </div>
                      <div class="flex items-center gap-x-3">
                        <input 
                          id="push-staff" 
                          type="radio" 
                          bind:group={formData.pilihRole}
                          value="staff"
                          class="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden" 
                        />
                        <label for="push-staff" class="block text-sm/6 font-medium text-gray-900">Staff</label>
                      </div>
                      <div class="flex items-center gap-x-3">
                        <input 
                          id="push-user" 
                          type="radio" 
                          bind:group={formData.pilihRole}
                          value="user"
                          class="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden" 
                        />
                        <label for="push-user" class="block text-sm/6 font-medium text-gray-900">User</label>
                      </div>
                    </div>
                  </fieldset>
                  
                  <fieldset class="sm:col-span-3">
                    <legend class="text-sm/6 font-semibold text-gray-900">Pilih Job</legend>
                    <div class="mt-6 space-y-3">
                      <!-- Project -->
                      <div class="flex gap-3">
                        <div class="flex h-6 shrink-0 items-center">
                          <div class="group grid size-4 grid-cols-1">
                            <input 
                              id="project" 
                              type="checkbox" 
                              bind:checked={formData.project}
                              aria-describedby="project-description" 
                              class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto" 
                            />
                            <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25">
                              <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-checked:opacity-100" />
                              <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-indeterminate:opacity-100" />
                            </svg>
                          </div>
                        </div>
                        <div class="text-sm/6">
                          <label for="project" class="font-medium text-gray-900">Project</label>
                        </div>
                      </div>
                      <!-- Activity -->
                      <div class="flex gap-3">
                        <div class="flex h-6 shrink-0 items-center">
                          <div class="group grid size-4 grid-cols-1">
                            <input 
                              id="activity" 
                              type="checkbox" 
                              bind:checked={formData.activity}
                              aria-describedby="activity-description" 
                              class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto" 
                            />
                            <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25">
                              <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-checked:opacity-100" />
                              <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-indeterminate:opacity-100" />
                            </svg>
                          </div>
                        </div>
                        <div class="text-sm/6">
                          <label for="activity" class="font-medium text-gray-900">Activity</label>
                        </div>
                      </div>
                      <!-- Mitra -->
                      <div class="flex gap-3">
                        <div class="flex h-6 shrink-0 items-center">
                          <div class="group grid size-4 grid-cols-1">
                            <input 
                              id="mitra" 
                              type="checkbox" 
                              bind:checked={formData.mitra}
                              aria-describedby="mitra-description" 
                              class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto" 
                            />
                            <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25">
                              <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-checked:opacity-100" />
                              <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-indeterminate:opacity-100" />
                            </svg>
                          </div>
                        </div>
                        <div class="text-sm/6">
                          <label for="mitra" class="font-medium text-gray-900">Mitra</label>
                        </div>
                      </div>
                    </div>
                  </fieldset>
              </div>
            </div>
          </div>
        </div>
      {/if}
  
      <div class="mt-6 flex items-center justify-end gap-x-6">
        <button type="button" on:click={handleCancel} class="text-sm/6 font-semibold text-gray-900">Cancel</button>
        <button type="submit" class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save</button>
      </div>
    </form>
  </div>