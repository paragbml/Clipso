// =====================================================
// CLIPSO - Premium Website Scripts
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    initNavScroll();
    initScrollAnimations();
    initCounters();
    initFAQ();
    initSmoothScroll();
    initPricingToggle();
    initParallaxEffects();
});

// === Parallax Effects ===
function initParallaxEffects() {
    const orbs = document.querySelectorAll('.floating-orb');
    const parallaxBgs = document.querySelectorAll('.parallax-bg');
    
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.pageYOffset;
                
                // Move orbs at different speeds for depth effect
                orbs.forEach((orb, index) => {
                    const speed = 0.05 + (index * 0.02);
                    const yOffset = scrollY * speed;
                    const xOffset = Math.sin(scrollY * 0.002 + index) * 20;
                    orb.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
                });
                
                // Parallax backgrounds
                parallaxBgs.forEach(bg => {
                    bg.style.transform = `translateY(${scrollY * 0.3}px)`;
                });
                
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Mouse parallax for orbs
    document.addEventListener('mousemove', (e) => {
        const mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        const mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        
        orbs.forEach((orb, index) => {
            const speed = 15 + (index * 10);
            const xMove = mouseX * speed;
            const yMove = mouseY * speed;
            orb.style.transform = `translate(${xMove}px, ${yMove}px)`;
        });
    });
}

// === Navigation Scroll Effect ===
function initNavScroll() {
    const nav = document.querySelector('.nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            nav.style.borderBottomColor = 'rgba(34, 34, 34, 0.8)';
        } else {
            nav.style.borderBottomColor = 'rgba(26, 26, 26, 0.5)';
        }

        lastScroll = currentScroll;
    });
}

// === Scroll Animations ===
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Add fade-in class to elements
    const animatedElements = document.querySelectorAll(
        '.step-card, .bento-card, .feature-row, .testimonial-card, .pricing-card, .faq-item'
    );

    animatedElements.forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${index * 0.05}s`;
        observer.observe(el);
    });

    // Section headers
    document.querySelectorAll('.section-header').forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// === Animated Counters ===
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');

    const animateCounter = (el) => {
        const target = parseFloat(el.dataset.target);
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();

        const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const current = start + (target - start) * easeOutQuart(progress);

            if (target < 100) {
                el.textContent = current.toFixed(1);
            } else {
                el.textContent = Math.round(current).toLocaleString();
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

// === FAQ Accordion ===
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');

            // Close all items
            faqItems.forEach(i => i.classList.remove('open'));

            // Open clicked item if it wasn't open
            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });
}

// === Smooth Scroll ===
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            if (target) {
                const navHeight = document.querySelector('.nav').offsetHeight;
                const targetPosition = target.offsetTop - navHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// === Pricing Toggle ===
function initPricingToggle() {
    const toggleLabels = document.querySelectorAll('.toggle-label');

    toggleLabels.forEach(label => {
        label.addEventListener('click', () => {
            toggleLabels.forEach(l => l.classList.remove('active'));
            label.classList.add('active');

            // Here you could add logic to switch pricing content
            // For now it's just visual
        });
    });
}

// === Chart Animation (Dashboard) ===
function animateChart() {
    const chartLine = document.querySelector('.chart-line');
    if (chartLine) {
        chartLine.style.strokeDashoffset = '0';
    }
}

// Trigger chart animation when visible
const dashboardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateChart();
            dashboardObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

const dashboardPreview = document.querySelector('.dashboard-preview');
if (dashboardPreview) {
    dashboardObserver.observe(dashboardPreview);
}

// === Logo Carousel - Pause on Hover ===
const logosSlide = document.querySelector('.logos-slide');
if (logosSlide) {
    logosSlide.addEventListener('mouseenter', () => {
        logosSlide.style.animationPlayState = 'paused';
    });

    logosSlide.addEventListener('mouseleave', () => {
        logosSlide.style.animationPlayState = 'running';
    });
}

// === Bento Cards - Subtle Hover Effect ===
document.querySelectorAll('.bento-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// === Live Counter Animation for Social Stats ===
function initLiveCounters() {
    const counterValues = document.querySelectorAll('.counter-value');

    counterValues.forEach(counter => {
        const target = parseInt(counter.dataset.target);
        let current = 0;
        const increment = Math.ceil(target / 60);
        const duration = 2000;
        const stepTime = duration / (target / increment);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const interval = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            counter.textContent = target.toLocaleString();
                            clearInterval(interval);
                            // Start fluctuating animation
                            startFluctuation(counter, target);
                        } else {
                            counter.textContent = current.toLocaleString();
                        }
                    }, stepTime);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(counter);
    });
}

// Make the counters fluctuate slightly like live data
function startFluctuation(element, baseValue) {
    setInterval(() => {
        const fluctuation = Math.floor(Math.random() * 100) - 50;
        const newValue = Math.max(0, baseValue + fluctuation);
        element.textContent = newValue.toLocaleString();
    }, 2000);
}

// Initialize live counters
document.addEventListener('DOMContentLoaded', initLiveCounters);

// === Add More Flying Hearts on Click ===
document.querySelectorAll('.hearts-action').forEach(action => {
    action.addEventListener('click', () => {
        const heartsContainer = action.querySelector('.flying-hearts');
        if (heartsContainer) {
            // Add burst of hearts
            for (let i = 0; i < 5; i++) {
                const heart = document.createElement('span');
                heart.className = 'heart burst-heart';
                heart.textContent = ['❤️', '💜', '💗', '🧡', '💛'][Math.floor(Math.random() * 5)];
                heart.style.setProperty('--delay', `${i * 0.1}s`);
                heart.style.setProperty('--x', `${(Math.random() - 0.5) * 40}px`);
                heartsContainer.appendChild(heart);

                // Remove after animation
                setTimeout(() => heart.remove(), 2000);
            }
        }
    });
});

// === Analytics Cards Animation ===
function initAnalyticsAnimations() {
    const analyticsCards = document.querySelectorAll('.analytics-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    analyticsCards.forEach((card, index) => {
        card.classList.add('fade-in');
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card);
    });
}

document.addEventListener('DOMContentLoaded', initAnalyticsAnimations);

// === Social Embed Interaction ===
document.querySelectorAll('.social-embed').forEach(embed => {
    embed.addEventListener('mouseenter', () => {
        const phone = embed.querySelector('.embed-phone');
        if (phone) {
            phone.style.animationPlayState = 'paused';
        }
    });

    embed.addEventListener('mouseleave', () => {
        const phone = embed.querySelector('.embed-phone');
        if (phone) {
            phone.style.animationPlayState = 'running';
        }
    });
});

// =====================================================
// SOCIAL VIRAL SHOWCASE - Premium Animations
// =====================================================

// === Animated Counters for Social Viral Section ===
function initViralCounters() {
    const counters = document.querySelectorAll('.animated-counter, .live-counter-value, .viewer-count');

    const animateCounter = (el) => {
        const target = parseInt(el.dataset.target);
        const duration = 2500;
        const start = 0;
        const startTime = performance.now();

        const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const current = start + (target - start) * easeOutQuart(progress);
            el.textContent = Math.round(current).toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                // Start live fluctuation after initial animation
                startLiveFluctuation(el, target);
            }
        };

        requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

// === Live Fluctuation for Counters ===
function startLiveFluctuation(element, baseValue) {
    setInterval(() => {
        const fluctuation = Math.floor(Math.random() * (baseValue * 0.005)) + 1;
        const newValue = baseValue + fluctuation;
        element.textContent = newValue.toLocaleString();
    }, 1500);
}

// === Click to Spawn More Hearts ===
function initHeartSpamClick() {
    const heartTriggers = document.querySelectorAll('.hearts-spam-trigger, .thumbsup-spam-trigger, .heart-btn');

    heartTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const container = trigger.querySelector('.flying-hearts-container, .flying-thumbs-container, .ig-flying-hearts');
            if (!container) return;

            const emojis = trigger.classList.contains('thumbsup-spam-trigger')
                ? ['👍', '👍🏻', '👍🏽', '👍🏾', '👍🏿']
                : ['❤️', '💜', '💗', '🧡', '💛', '💙'];

            // Spawn burst of emojis
            for (let i = 0; i < 8; i++) {
                const emoji = document.createElement('span');
                emoji.className = trigger.classList.contains('thumbsup-spam-trigger') ? 'flying-thumb burst' : 'flying-heart burst';
                emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                emoji.style.setProperty('--delay', `${i * 0.08}s`);
                emoji.style.setProperty('--x', `${(Math.random() - 0.5) * 50}px`);
                emoji.style.setProperty('--size', `${20 + Math.random() * 12}px`);
                container.appendChild(emoji);

                // Remove after animation
                setTimeout(() => emoji.remove(), 2500);
            }
        });
    });
}

// === Instagram Double Tap Effect ===
function initInstagramDoubleTap() {
    const igVideos = document.querySelectorAll('.ig-video-container');

    igVideos.forEach(video => {
        let lastTap = 0;

        video.addEventListener('click', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;

            if (tapLength < 500 && tapLength > 0) {
                // Double tap detected - spawn big heart
                const heart = document.createElement('span');
                heart.className = 'double-tap-heart burst';
                heart.textContent = '❤️';
                heart.style.setProperty('--scale', `${0.8 + Math.random() * 0.8}`);
                heart.style.setProperty('--delay', '0s');

                const heartsContainer = video.querySelector('.ig-double-tap-hearts');
                if (heartsContainer) {
                    heartsContainer.appendChild(heart);
                    setTimeout(() => heart.remove(), 2500);
                }
            }
            lastTap = currentTime;
        });
    });
}

// === Gauge Animation Trigger ===
function initGaugeAnimations() {
    const gauges = document.querySelectorAll('.gauge-progress');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    gauges.forEach(gauge => {
        gauge.style.animationPlayState = 'paused';
        observer.observe(gauge);
    });
}

// === Bar Animation Trigger ===
function initBarAnimations() {
    const bars = document.querySelectorAll('.animated-bar-fill');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    bars.forEach(bar => {
        bar.style.animationPlayState = 'paused';
        observer.observe(bar);
    });
}

// === Live Activity Feed Animation ===
function initActivityFeed() {
    const activityFeed = document.querySelector('.activity-feed');
    if (!activityFeed) return;

    const activities = [
        { icon: '🎉', text: '<strong>@viral_edits</strong> clip hit 500K views', time: 'Just now' },
        { icon: '💰', text: '<strong>Mike T.</strong> earned $189 bonus', time: 'Just now' },
        { icon: '🚀', text: '<strong>FitBrand</strong> campaign launched', time: 'Just now' },
        { icon: '⭐', text: '<strong>@quickcuts</strong> got verified badge', time: 'Just now' },
        { icon: '🔥', text: '<strong>TechStartup</strong> clip trending!', time: 'Just now' },
        { icon: '💎', text: '<strong>@proeditor</strong> reached Diamond tier', time: 'Just now' },
    ];

    let index = 0;

    setInterval(() => {
        const activity = activities[index % activities.length];
        const newItem = document.createElement('div');
        newItem.className = 'activity-item new-activity';
        newItem.innerHTML = `
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-content">
                <span class="activity-text">${activity.text}</span>
                <span class="activity-time">${activity.time}</span>
            </div>
        `;

        // Remove old 'new-activity' class from previous items
        activityFeed.querySelectorAll('.activity-item').forEach(item => {
            item.classList.remove('new-activity');
        });

        // Add new item at top
        activityFeed.insertBefore(newItem, activityFeed.firstChild);

        // Remove oldest item if more than 6
        while (activityFeed.children.length > 6) {
            activityFeed.removeChild(activityFeed.lastChild);
        }

        index++;
    }, 4000);
}

// === Heatmap Cell Interactions ===
function initHeatmapInteractions() {
    const heatmapCells = document.querySelectorAll('.heatmap-cell');
    
    heatmapCells.forEach(cell => {
        cell.addEventListener('mouseenter', (e) => {
            // Create glow effect
            cell.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.6)';
        });
        
        cell.addEventListener('mouseleave', (e) => {
            cell.style.boxShadow = '';
        });
    });
}

// === Comparison Bars Animation ===
function initComparisonBars() {
    const comparisonBars = document.querySelectorAll('.bar-before, .bar-after');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Trigger CSS animation by setting width
                const targetWidth = entry.target.style.getPropertyValue('--width');
                entry.target.style.width = '0%';
                setTimeout(() => {
                    entry.target.style.width = targetWidth;
                }, 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    comparisonBars.forEach(bar => {
        bar.style.width = '0%';
        observer.observe(bar);
    });
}

// === Radial Progress Animation ===
function initRadialProgress() {
    const radialItems = document.querySelectorAll('.radial-progress');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    radialItems.forEach(item => {
        item.style.animationPlayState = 'paused';
        observer.observe(item);
    });
}

// Initialize all Social Viral features
document.addEventListener('DOMContentLoaded', () => {
    initViralCounters();
    initHeartSpamClick();
    initInstagramDoubleTap();
    initGaugeAnimations();
    initBarAnimations();
    initActivityFeed();
    initHeatmapInteractions();
    initComparisonBars();
    initRadialProgress();
});
