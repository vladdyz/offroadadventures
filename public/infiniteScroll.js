// Infinite scroll for the campgrounds index page.
// Watches a sentinel element near the bottom of the list; when it becomes
// visible, fetches the next page of campgrounds and appends them.

// The campgrounds index page scroll code, watching a sentinel element near bottom of current list
// when this element becomes visible, fetch the next page of campgrounds (depending on user selection)
// and append them to current liut

(function () {
    const list = document.getElementById('campground-list');
    const sentinel = document.getElementById('scroll-sentinel');
    const loadingIndicator = document.getElementById('loading-indicator');
    const pageSizeSelect = document.getElementById('pageSizeSelect');

    if (!list || !sentinel) return;

    let state = window.paginationState || { page: 1, hasMore: false, limit: 10 };
    let isLoading = false;

    async function loadNextPage() {
        if (isLoading || !state.hasMore) return;
        isLoading = true;
        loadingIndicator.style.display = 'block';

        try {
            const nextPage = state.page + 1;
            const response = await fetch(`/campgrounds?page=${nextPage}&limit=${state.limit}`, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) throw new Error(`Server responded with ${response.status}`);

            const data = await response.json();
            list.insertAdjacentHTML('beforeend', data.html);

            state.page = data.page;
            state.hasMore = data.hasMore;

            if (!state.hasMore) observer.unobserve(sentinel);
        } catch (err) {
            console.error('Failed to load more campgrounds:', err);
            state.hasMore = false; // if endpoint fails do not retry load
            observer.unobserve(sentinel);
        } finally {
            isLoading = false;
            loadingIndicator.style.display = 'none';
        }
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) loadNextPage(); });
    }, { rootMargin: '200px' }); // start loading a bit before the sentinel is actually on-screen

    if (state.hasMore) observer.observe(sentinel);
    // changing the limit renavigates with it added to the query string and applies it immediately
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', () => {
            const params = new URLSearchParams(window.location.search);
            params.set('limit', pageSizeSelect.value);
            params.delete('page');
            window.location.href = `/campgrounds?${params.toString()}`;
        });
    }
})();