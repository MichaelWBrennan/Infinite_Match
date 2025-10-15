using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Linq;

namespace Evergreen.Subscription
{
    [System.Serializable]
    public class SubscriptionPlan
    {
        public string planId;
        public string name;
        public string description;
        public SubscriptionTier tier;
        public float monthlyPrice;
        public float yearlyPrice;
        public string currency;
        public List<SubscriptionBenefit> benefits = new List<SubscriptionBenefit>();
        public bool isActive;
        public bool isPopular;
        public string iconUrl;
        public string bannerUrl;
        public Dictionary<string, object> metadata = new Dictionary<string, object>();
    }
    
    public enum SubscriptionTier
    {
        Free,
        Basic,
        Premium,
        Pro,
        Ultimate
    }
    
    [System.Serializable]
    public class SubscriptionBenefit
    {
        public string benefitId;
        public string name;
        public string description;
        public BenefitType benefitType;
        public float value;
        public string unit;
        public bool isUnlimited;
        public string iconUrl;
    }
    
    public enum BenefitType
    {
        Energy,
        Coins,
        Gems,
        Levels,
        Content,
        Features,
        Discount,
        Priority,
        Exclusive,
        AdFree
    }
    
    [System.Serializable]
    public class PlayerSubscription
    {
        public string playerId;
        public string planId;
        public SubscriptionTier currentTier;
        public SubscriptionStatus status;
        public DateTime startDate;
        public DateTime endDate;
        public DateTime nextBillingDate;
        public float amountPaid;
        public string currency;
        public PaymentMethod paymentMethod;
        public bool autoRenew;
        public int billingCycle; // 1 = monthly, 12 = yearly
        public List<SubscriptionHistory> history = new List<SubscriptionHistory>();
        public Dictionary<string, object> usage = new Dictionary<string, object>();
        public DateTime lastUpdated;
    }
    
    public enum SubscriptionStatus
    {
        Active,
        Expired,
        Cancelled,
        Paused,
        Pending,
        Failed,
        Refunded
    }
    
    public enum PaymentMethod
    {
        CreditCard,
        PayPal,
        ApplePay,
        GooglePay,
        Cryptocurrency,
        BankTransfer
    }
    
    [System.Serializable]
    public class SubscriptionHistory
    {
        public string historyId;
        public string action;
        public DateTime timestamp;
        public float amount;
        public string currency;
        public string description;
        public Dictionary<string, object> metadata = new Dictionary<string, object>();
    }
    
    [System.Serializable]
    public class FamilyPlan
    {
        public string familyId;
        public string ownerId;
        public List<string> members = new List<string>();
        public int maxMembers;
        public SubscriptionTier tier;
        public DateTime created;
        public DateTime expires;
        public bool isActive;
    }
    
    [System.Serializable]
    public class RegionalPricing
    {
        public string region;
        public string currency;
        public float exchangeRate;
        public Dictionary<string, float> planPrices = new Dictionary<string, float>();
        public List<string> supportedPaymentMethods = new List<string>();
        public bool isAvailable;
    }
    
    public class SubscriptionManager : MonoBehaviour
    {
        [Header("Subscription Settings")]
        public bool enableSubscriptions = true;
        public bool enableFamilyPlans = true;
        public bool enableRegionalPricing = true;
        public bool enableTrialPeriods = true;
        public bool enableGiftSubscriptions = true;
        
        [Header("Pricing Settings")]
        public string defaultCurrency = "USD";
        public float familyPlanDiscount = 0.2f; // 20% discount
        public float yearlyDiscount = 0.15f; // 15% discount
        public int trialDays = 7;
        public float refundWindowHours = 24f;
        
        [Header("Benefits Settings")]
        public bool enableUnlimitedEnergy = true;
        public bool enableAdFree = true;
        public bool enableExclusiveContent = true;
        public bool enablePrioritySupport = true;
        public bool enableEarlyAccess = true;
        
        public static SubscriptionManager Instance { get; private set; }
        
        private Dictionary<string, SubscriptionPlan> subscriptionPlans = new Dictionary<string, SubscriptionPlan>();
        private Dictionary<string, PlayerSubscription> playerSubscriptions = new Dictionary<string, PlayerSubscription>();
        private Dictionary<string, FamilyPlan> familyPlans = new Dictionary<string, FamilyPlan>();
        private Dictionary<string, RegionalPricing> regionalPricing = new Dictionary<string, RegionalPricing>();
        private PaymentProcessor paymentProcessor;
        private SubscriptionAnalytics subscriptionAnalytics;
        private NotificationManager notificationManager;
        private Coroutine subscriptionCheckCoroutine;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeSubscriptionManager();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            InitializePlans();
            InitializeComponents();
            StartSubscriptionChecks();
        }
        
        private void InitializeSubscriptionManager()
        {
            // Initialize payment processor
            paymentProcessor = gameObject.AddComponent<PaymentProcessor>();
            
            // Initialize analytics
            subscriptionAnalytics = gameObject.AddComponent<SubscriptionAnalytics>();
            
            // Initialize notification manager
            notificationManager = gameObject.AddComponent<NotificationManager>();
        }
        
        private void InitializePlans()
        {
            // Create subscription plans
            CreateSubscriptionPlans();
            
            // Initialize regional pricing
            if (enableRegionalPricing)
            {
                InitializeRegionalPricing();
            }
        }
        
        private void CreateSubscriptionPlans()
        {
            // Free Plan
            var freePlan = new SubscriptionPlan
            {
                planId = "free",
                name = "Free",
                description = "Basic gameplay with limited features",
                tier = SubscriptionTier.Free,
                monthlyPrice = 0f,
                yearlyPrice = 0f,
                currency = defaultCurrency,
                isActive = true,
                benefits = new List<SubscriptionBenefit>
                {
                    new SubscriptionBenefit { benefitId = "energy_5", name = "5 Energy", description = "5 energy per day", benefitType = BenefitType.Energy, value = 5f, unit = "per day" },
                    new SubscriptionBenefit { benefitId = "ads", name = "Ads", description = "Watch ads for rewards", benefitType = BenefitType.AdFree, value = 0f, unit = "disabled" }
                }
            };
            subscriptionPlans["free"] = freePlan;
            
            // Basic Plan
            var basicPlan = new SubscriptionPlan
            {
                planId = "basic",
                name = "Basic",
                description = "Enhanced gameplay with more features",
                tier = SubscriptionTier.Basic,
                monthlyPrice = 4.99f,
                yearlyPrice = 49.99f,
                currency = defaultCurrency,
                isActive = true,
                benefits = new List<SubscriptionBenefit>
                {
                    new SubscriptionBenefit { benefitId = "energy_20", name = "20 Energy", description = "20 energy per day", benefitType = BenefitType.Energy, value = 20f, unit = "per day" },
                    new SubscriptionBenefit { benefitId = "coins_1000", name = "1000 Coins", description = "1000 coins per month", benefitType = BenefitType.Coins, value = 1000f, unit = "per month" },
                    new SubscriptionBenefit { benefitId = "gems_50", name = "50 Gems", description = "50 gems per month", benefitType = BenefitType.Gems, value = 50f, unit = "per month" },
                    new SubscriptionBenefit { benefitId = "ad_free", name = "Ad-Free", description = "No ads", benefitType = BenefitType.AdFree, value = 1f, unit = "enabled" }
                }
            };
            subscriptionPlans["basic"] = basicPlan;
            
            // Premium Plan
            var premiumPlan = new SubscriptionPlan
            {
                planId = "premium",
                name = "Premium",
                description = "Full access to all features",
                tier = SubscriptionTier.Premium,
                monthlyPrice = 9.99f,
                yearlyPrice = 99.99f,
                currency = defaultCurrency,
                isActive = true,
                isPopular = true,
                benefits = new List<SubscriptionBenefit>
                {
                    new SubscriptionBenefit { benefitId = "unlimited_energy", name = "Unlimited Energy", description = "Unlimited energy", benefitType = BenefitType.Energy, value = -1f, unit = "unlimited", isUnlimited = true },
                    new SubscriptionBenefit { benefitId = "coins_5000", name = "5000 Coins", description = "5000 coins per month", benefitType = BenefitType.Coins, value = 5000f, unit = "per month" },
                    new SubscriptionBenefit { benefitId = "gems_200", name = "200 Gems", description = "200 gems per month", benefitType = BenefitType.Gems, value = 200f, unit = "per month" },
                    new SubscriptionBenefit { benefitId = "ad_free", name = "Ad-Free", description = "No ads", benefitType = BenefitType.AdFree, value = 1f, unit = "enabled" },
                    new SubscriptionBenefit { benefitId = "exclusive_content", name = "Exclusive Content", description = "Access to exclusive levels and content", benefitType = BenefitType.Exclusive, value = 1f, unit = "enabled" },
                    new SubscriptionBenefit { benefitId = "priority_support", name = "Priority Support", description = "Priority customer support", benefitType = BenefitType.Priority, value = 1f, unit = "enabled" }
                }
            };
            subscriptionPlans["premium"] = premiumPlan;
            
            // Pro Plan
            var proPlan = new SubscriptionPlan
            {
                planId = "pro",
                name = "Pro",
                description = "Professional features for serious players",
                tier = SubscriptionTier.Pro,
                monthlyPrice = 19.99f,
                yearlyPrice = 199.99f,
                currency = defaultCurrency,
                isActive = true,
                benefits = new List<SubscriptionBenefit>
                {
                    new SubscriptionBenefit { benefitId = "unlimited_energy", name = "Unlimited Energy", description = "Unlimited energy", benefitType = BenefitType.Energy, value = -1f, unit = "unlimited", isUnlimited = true },
                    new SubscriptionBenefit { benefitId = "coins_10000", name = "10000 Coins", description = "10000 coins per month", benefitType = BenefitType.Coins, value = 10000f, unit = "per month" },
                    new SubscriptionBenefit { benefitId = "gems_500", name = "500 Gems", description = "500 gems per month", benefitType = BenefitType.Gems, value = 500f, unit = "per month" },
                    new SubscriptionBenefit { benefitId = "ad_free", name = "Ad-Free", description = "No ads", benefitType = BenefitType.AdFree, value = 1f, unit = "enabled" },
                    new SubscriptionBenefit { benefitId = "exclusive_content", name = "Exclusive Content", description = "Access to exclusive levels and content", benefitType = BenefitType.Exclusive, value = 1f, unit = "enabled" },
                    new SubscriptionBenefit { benefitId = "priority_support", name = "Priority Support", description = "Priority customer support", benefitType = BenefitType.Priority, value = 1f, unit = "enabled" },
                    new SubscriptionBenefit { benefitId = "early_access", name = "Early Access", description = "Early access to new features", benefitType = BenefitType.EarlyAccess, value = 1f, unit = "enabled" },
                    new SubscriptionBenefit { benefitId = "discount_20", name = "20% Discount", description = "20% discount on all purchases", benefitType = BenefitType.Discount, value = 0.2f, unit = "percent" }
                }
            };
            subscriptionPlans["pro"] = proPlan;
            
            // Ultimate Plan
            var ultimatePlan = new SubscriptionPlan
            {
                planId = "ultimate",
                name = "Ultimate",
                description = "Everything included for the ultimate experience",
                tier = SubscriptionTier.Ultimate,
                monthlyPrice = 39.99f,
                yearlyPrice = 399.99f,
                currency = defaultCurrency,
                isActive = true,
                benefits = new List<SubscriptionBenefit>
                {
                    new SubscriptionBenefit { benefitId = "unlimited_energy", name = "Unlimited Energy", description = "Unlimited energy", benefitType = BenefitType.Energy, value = -1f, unit = "unlimited", isUnlimited = true },
                    new SubscriptionBenefit { benefitId = "coins_20000", name = "20000 Coins", description = "20000 coins per month", benefitType = BenefitType.Coins, value = 20000f, unit = "per month" },
                    new SubscriptionBenefit { benefitId = "gems_1000", name = "1000 Gems", description = "1000 gems per month", benefitType = BenefitType.Gems, value = 1000f, unit = "per month" },
                    new SubscriptionBenefit { benefitId = "ad_free", name = "Ad-Free", description = "No ads", benefitType = BenefitType.AdFree, value = 1f, unit = "enabled" },
                    new SubscriptionBenefit { benefitId = "exclusive_content", name = "Exclusive Content", description = "Access to exclusive levels and content", benefitType = BenefitType.Exclusive, value = 1f, unit = "enabled" },
                    new SubscriptionBenefit { benefitId = "priority_support", name = "Priority Support", description = "Priority customer support", benefitType = BenefitType.Priority, value = 1f, unit = "enabled" },
                    new SubscriptionBenefit { benefitId = "early_access", name = "Early Access", description = "Early access to new features", benefitType = BenefitType.EarlyAccess, value = 1f, unit = "enabled" },
                    new SubscriptionBenefit { benefitId = "discount_30", name = "30% Discount", description = "30% discount on all purchases", benefitType = BenefitType.Discount, value = 0.3f, unit = "percent" },
                    new SubscriptionBenefit { benefitId = "family_plan", name = "Family Plan", description = "Share with up to 6 family members", benefitType = BenefitType.Features, value = 6f, unit = "members" }
                }
            };
            subscriptionPlans["ultimate"] = ultimatePlan;
        }
        
        private void InitializeRegionalPricing()
        {
            // US Pricing
            regionalPricing["US"] = new RegionalPricing
            {
                region = "US",
                currency = "USD",
                exchangeRate = 1.0f,
                planPrices = new Dictionary<string, float>
                {
                    {"basic_monthly", 4.99f},
                    {"basic_yearly", 49.99f},
                    {"premium_monthly", 9.99f},
                    {"premium_yearly", 99.99f},
                    {"pro_monthly", 19.99f},
                    {"pro_yearly", 199.99f},
                    {"ultimate_monthly", 39.99f},
                    {"ultimate_yearly", 399.99f}
                },
                supportedPaymentMethods = new List<string> { "credit_card", "paypal", "apple_pay", "google_pay" },
                isAvailable = true
            };
            
            // EU Pricing
            regionalPricing["EU"] = new RegionalPricing
            {
                region = "EU",
                currency = "EUR",
                exchangeRate = 0.85f,
                planPrices = new Dictionary<string, float>
                {
                    {"basic_monthly", 4.99f},
                    {"basic_yearly", 49.99f},
                    {"premium_monthly", 9.99f},
                    {"premium_yearly", 99.99f},
                    {"pro_monthly", 19.99f},
                    {"pro_yearly", 199.99f},
                    {"ultimate_monthly", 39.99f},
                    {"ultimate_yearly", 399.99f}
                },
                supportedPaymentMethods = new List<string> { "credit_card", "paypal", "bank_transfer" },
                isAvailable = true
            };
            
            // Add more regions as needed
        }
        
        private void InitializeComponents()
        {
            if (paymentProcessor != null)
            {
                paymentProcessor.Initialize();
            }
            
            if (subscriptionAnalytics != null)
            {
                subscriptionAnalytics.Initialize();
            }
            
            if (notificationManager != null)
            {
                notificationManager.Initialize();
            }
        }
        
        private void StartSubscriptionChecks()
        {
            subscriptionCheckCoroutine = StartCoroutine(SubscriptionCheckLoop());
        }
        
        private IEnumerator SubscriptionCheckLoop()
        {
            while (true)
            {
                CheckExpiredSubscriptions();
                ProcessRenewals();
                yield return new WaitForSeconds(3600f); // Check every hour
            }
        }
        
        // Subscription Management
        public bool SubscribeToPlan(string playerId, string planId, int billingCycle, PaymentMethod paymentMethod, bool autoRenew = true)
        {
            var plan = GetSubscriptionPlan(planId);
            if (plan == null) return false;
            
            // Check if player already has an active subscription
            if (HasActiveSubscription(playerId))
            {
                return false;
            }
            
            // Calculate pricing
            var price = billingCycle == 12 ? plan.yearlyPrice : plan.monthlyPrice;
            var currency = plan.currency;
            
            // Apply discounts
            if (billingCycle == 12)
            {
                price *= (1f - yearlyDiscount);
            }
            
            // Process payment
            if (paymentProcessor != null)
            {
                var paymentSuccess = paymentProcessor.ProcessPayment(playerId, planId, price, currency, paymentMethod);
                if (!paymentSuccess) return false;
            }
            
            // Create subscription
            var subscription = new PlayerSubscription
            {
                playerId = playerId,
                planId = planId,
                currentTier = plan.tier,
                status = SubscriptionStatus.Active,
                startDate = DateTime.Now,
                endDate = DateTime.Now.AddMonths(billingCycle),
                nextBillingDate = DateTime.Now.AddMonths(billingCycle),
                amountPaid = price,
                currency = currency,
                paymentMethod = paymentMethod,
                autoRenew = autoRenew,
                billingCycle = billingCycle,
                lastUpdated = DateTime.Now
            };
            
            // Add to history
            subscription.history.Add(new SubscriptionHistory
            {
                historyId = Guid.NewGuid().ToString(),
                action = "subscription_started",
                timestamp = DateTime.Now,
                amount = price,
                currency = currency,
                description = $"Subscribed to {plan.name} plan"
            });
            
            playerSubscriptions[playerId] = subscription;
            
            // Apply benefits
            ApplySubscriptionBenefits(playerId, plan);
            
            // Send notification
            if (notificationManager != null)
            {
                notificationManager.SendSubscriptionNotification(playerId, "subscription_started", plan.name);
            }
            
            return true;
        }
        
        public bool CancelSubscription(string playerId, bool immediate = false)
        {
            var subscription = GetPlayerSubscription(playerId);
            if (subscription == null) return false;
            
            if (immediate)
            {
                subscription.status = SubscriptionStatus.Cancelled;
                subscription.endDate = DateTime.Now;
                RemoveSubscriptionBenefits(playerId);
            }
            else
            {
                subscription.status = SubscriptionStatus.Cancelled;
                subscription.autoRenew = false;
                // Benefits remain active until end date
            }
            
            subscription.lastUpdated = DateTime.Now;
            
            // Add to history
            subscription.history.Add(new SubscriptionHistory
            {
                historyId = Guid.NewGuid().ToString(),
                action = "subscription_cancelled",
                timestamp = DateTime.Now,
                amount = 0f,
                currency = subscription.currency,
                description = "Subscription cancelled"
            });
            
            // Send notification
            if (notificationManager != null)
            {
                notificationManager.SendSubscriptionNotification(playerId, "subscription_cancelled", subscription.planId);
            }
            
            return true;
        }
        
        public bool PauseSubscription(string playerId, int days)
        {
            var subscription = GetPlayerSubscription(playerId);
            if (subscription == null || subscription.status != SubscriptionStatus.Active) return false;
            
            subscription.status = SubscriptionStatus.Paused;
            subscription.endDate = subscription.endDate.AddDays(days);
            subscription.nextBillingDate = subscription.nextBillingDate.AddDays(days);
            subscription.lastUpdated = DateTime.Now;
            
            // Add to history
            subscription.history.Add(new SubscriptionHistory
            {
                historyId = Guid.NewGuid().ToString(),
                action = "subscription_paused",
                timestamp = DateTime.Now,
                amount = 0f,
                currency = subscription.currency,
                description = $"Subscription paused for {days} days"
            });
            
            return true;
        }
        
        public bool ResumeSubscription(string playerId)
        {
            var subscription = GetPlayerSubscription(playerId);
            if (subscription == null || subscription.status != SubscriptionStatus.Paused) return false;
            
            subscription.status = SubscriptionStatus.Active;
            subscription.lastUpdated = DateTime.Now;
            
            // Add to history
            subscription.history.Add(new SubscriptionHistory
            {
                historyId = Guid.NewGuid().ToString(),
                action = "subscription_resumed",
                timestamp = DateTime.Now,
                amount = 0f,
                currency = subscription.currency,
                description = "Subscription resumed"
            });
            
            return true;
        }
        
        // Family Plan Management
        public bool CreateFamilyPlan(string ownerId, int maxMembers = 6)
        {
            if (!enableFamilyPlans) return false;
            
            var ownerSubscription = GetPlayerSubscription(ownerId);
            if (ownerSubscription == null || ownerSubscription.currentTier != SubscriptionTier.Ultimate) return false;
            
            var familyPlan = new FamilyPlan
            {
                familyId = Guid.NewGuid().ToString(),
                ownerId = ownerId,
                maxMembers = maxMembers,
                tier = ownerSubscription.currentTier,
                created = DateTime.Now,
                expires = ownerSubscription.endDate,
                isActive = true
            };
            
            familyPlan.members.Add(ownerId);
            familyPlans[familyPlan.familyId] = familyPlan;
            
            return true;
        }
        
        public bool JoinFamilyPlan(string playerId, string familyId)
        {
            var familyPlan = GetFamilyPlan(familyId);
            if (familyPlan == null || !familyPlan.isActive) return false;
            
            if (familyPlan.members.Count >= familyPlan.maxMembers) return false;
            if (familyPlan.members.Contains(playerId)) return false;
            
            familyPlan.members.Add(playerId);
            
            // Apply family plan benefits
            ApplyFamilyPlanBenefits(playerId, familyPlan);
            
            return true;
        }
        
        public bool LeaveFamilyPlan(string playerId, string familyId)
        {
            var familyPlan = GetFamilyPlan(familyId);
            if (familyPlan == null) return false;
            
            if (familyPlan.ownerId == playerId) return false; // Owner can't leave
            
            familyPlan.members.Remove(playerId);
            RemoveFamilyPlanBenefits(playerId);
            
            return true;
        }
        
        // Trial Management
        public bool StartTrial(string playerId, string planId)
        {
            if (!enableTrialPeriods) return false;
            
            var plan = GetSubscriptionPlan(planId);
            if (plan == null) return false;
            
            // Check if player has already used trial
            if (HasUsedTrial(playerId)) return false;
            
            var subscription = new PlayerSubscription
            {
                playerId = playerId,
                planId = planId,
                currentTier = plan.tier,
                status = SubscriptionStatus.Active,
                startDate = DateTime.Now,
                endDate = DateTime.Now.AddDays(trialDays),
                nextBillingDate = DateTime.Now.AddDays(trialDays),
                amountPaid = 0f,
                currency = plan.currency,
                paymentMethod = PaymentMethod.CreditCard,
                autoRenew = false,
                billingCycle = 1,
                lastUpdated = DateTime.Now
            };
            
            playerSubscriptions[playerId] = subscription;
            ApplySubscriptionBenefits(playerId, plan);
            
            return true;
        }
        
        // Gift Subscriptions
        public bool GiftSubscription(string gifterId, string recipientId, string planId, int billingCycle)
        {
            if (!enableGiftSubscriptions) return false;
            
            var plan = GetSubscriptionPlan(planId);
            if (plan == null) return false;
            
            // Check if recipient already has an active subscription
            if (HasActiveSubscription(recipientId)) return false;
            
            // Process payment for gifter
            var price = billingCycle == 12 ? plan.yearlyPrice : plan.monthlyPrice;
            if (paymentProcessor != null)
            {
                var paymentSuccess = paymentProcessor.ProcessPayment(gifterId, planId, price, plan.currency, PaymentMethod.CreditCard);
                if (!paymentSuccess) return false;
            }
            
            // Create subscription for recipient
            var subscription = new PlayerSubscription
            {
                playerId = recipientId,
                planId = planId,
                currentTier = plan.tier,
                status = SubscriptionStatus.Active,
                startDate = DateTime.Now,
                endDate = DateTime.Now.AddMonths(billingCycle),
                nextBillingDate = DateTime.Now.AddMonths(billingCycle),
                amountPaid = price,
                currency = plan.currency,
                paymentMethod = PaymentMethod.CreditCard,
                autoRenew = false,
                billingCycle = billingCycle,
                lastUpdated = DateTime.Now
            };
            
            playerSubscriptions[recipientId] = subscription;
            ApplySubscriptionBenefits(recipientId, plan);
            
            return true;
        }
        
        // Utility Methods
        public SubscriptionPlan GetSubscriptionPlan(string planId)
        {
            return subscriptionPlans.ContainsKey(planId) ? subscriptionPlans[planId] : null;
        }
        
        public List<SubscriptionPlan> GetAllSubscriptionPlans()
        {
            return subscriptionPlans.Values.Where(p => p.isActive).ToList();
        }
        
        public PlayerSubscription GetPlayerSubscription(string playerId)
        {
            return playerSubscriptions.ContainsKey(playerId) ? playerSubscriptions[playerId] : null;
        }
        
        public FamilyPlan GetFamilyPlan(string familyId)
        {
            return familyPlans.ContainsKey(familyId) ? familyPlans[familyId] : null;
        }
        
        public bool HasActiveSubscription(string playerId)
        {
            var subscription = GetPlayerSubscription(playerId);
            return subscription != null && subscription.status == SubscriptionStatus.Active && subscription.endDate > DateTime.Now;
        }
        
        public bool HasUsedTrial(string playerId)
        {
            var subscription = GetPlayerSubscription(playerId);
            return subscription != null && subscription.amountPaid == 0f;
        }
        
        public SubscriptionTier GetPlayerTier(string playerId)
        {
            var subscription = GetPlayerSubscription(playerId);
            if (subscription != null && HasActiveSubscription(playerId))
            {
                return subscription.currentTier;
            }
            
            // Check family plan
            var familyPlan = familyPlans.Values.FirstOrDefault(f => f.members.Contains(playerId) && f.isActive);
            if (familyPlan != null)
            {
                return familyPlan.tier;
            }
            
            return SubscriptionTier.Free;
        }
        
        public List<SubscriptionBenefit> GetPlayerBenefits(string playerId)
        {
            var subscription = GetPlayerSubscription(playerId);
            if (subscription != null && HasActiveSubscription(playerId))
            {
                var plan = GetSubscriptionPlan(subscription.planId);
                return plan?.benefits ?? new List<SubscriptionBenefit>();
            }
            
            // Check family plan
            var familyPlan = familyPlans.Values.FirstOrDefault(f => f.members.Contains(playerId) && f.isActive);
            if (familyPlan != null)
            {
                var plan = GetSubscriptionPlan(familyPlan.tier.ToString().ToLower());
                return plan?.benefits ?? new List<SubscriptionBenefit>();
            }
            
            // Return free plan benefits
            var freePlan = GetSubscriptionPlan("free");
            return freePlan?.benefits ?? new List<SubscriptionBenefit>();
        }
        
        public bool HasBenefit(string playerId, BenefitType benefitType)
        {
            var benefits = GetPlayerBenefits(playerId);
            return benefits.Any(b => b.benefitType == benefitType);
        }
        
        public float GetBenefitValue(string playerId, BenefitType benefitType)
        {
            var benefits = GetPlayerBenefits(playerId);
            var benefit = benefits.FirstOrDefault(b => b.benefitType == benefitType);
            return benefit?.value ?? 0f;
        }
        
        public bool IsUnlimited(string playerId, BenefitType benefitType)
        {
            var benefits = GetPlayerBenefits(playerId);
            var benefit = benefits.FirstOrDefault(b => b.benefitType == benefitType);
            return benefit?.isUnlimited ?? false;
        }
        
        public float GetRegionalPrice(string planId, int billingCycle, string region = "US")
        {
            if (!enableRegionalPricing || !regionalPricing.ContainsKey(region))
            {
                var plan = GetSubscriptionPlan(planId);
                return billingCycle == 12 ? plan?.yearlyPrice ?? 0f : plan?.monthlyPrice ?? 0f;
            }
            
            var regionalPricingData = regionalPricing[region];
            var priceKey = $"{planId}_{(billingCycle == 12 ? "yearly" : "monthly")}";
            
            if (regionalPricingData.planPrices.ContainsKey(priceKey))
            {
                return regionalPricingData.planPrices[priceKey];
            }
            
            return 0f;
        }
        
        public List<string> GetSupportedPaymentMethods(string region = "US")
        {
            if (!enableRegionalPricing || !regionalPricing.ContainsKey(region))
            {
                return new List<string> { "credit_card", "paypal" };
            }
            
            return regionalPricing[region].supportedPaymentMethods;
        }
        
        private void ApplySubscriptionBenefits(string playerId, SubscriptionPlan plan)
        {
            // Apply benefits to player
            foreach (var benefit in plan.benefits)
            {
                ApplyBenefit(playerId, benefit);
            }
        }
        
        private void RemoveSubscriptionBenefits(string playerId)
        {
            // Remove all subscription benefits
            // This would integrate with the game state system
        }
        
        private void ApplyFamilyPlanBenefits(string playerId, FamilyPlan familyPlan)
        {
            var plan = GetSubscriptionPlan(familyPlan.tier.ToString().ToLower());
            if (plan != null)
            {
                ApplySubscriptionBenefits(playerId, plan);
            }
        }
        
        private void RemoveFamilyPlanBenefits(string playerId)
        {
            RemoveSubscriptionBenefits(playerId);
        }
        
        private void ApplyBenefit(string playerId, SubscriptionBenefit benefit)
        {
            // Apply specific benefit to player
            // This would integrate with the game state system
            switch (benefit.benefitType)
            {
                case BenefitType.Energy:
                    if (benefit.isUnlimited)
                    {
                        // Set unlimited energy
                    }
                    else
                    {
                        // Add energy
                    }
                    break;
                case BenefitType.Coins:
                    // Add coins
                    break;
                case BenefitType.Gems:
                    // Add gems
                    break;
                case BenefitType.AdFree:
                    PlayerPrefs.SetInt("ads_removed", 1);
                    PlayerPrefs.Save();
                    break;
                case BenefitType.Exclusive:
                    // Unlock exclusive content
                    break;
                case BenefitType.Priority:
                    // Set priority support
                    break;
                case BenefitType.EarlyAccess:
                    // Enable early access
                    break;
                case BenefitType.Discount:
                    // Apply discount
                    break;
            }
        }
        
        private void CheckExpiredSubscriptions()
        {
            var expiredSubscriptions = playerSubscriptions.Values
                .Where(s => s.status == SubscriptionStatus.Active && s.endDate <= DateTime.Now)
                .ToList();
            
            foreach (var subscription in expiredSubscriptions)
            {
                subscription.status = SubscriptionStatus.Expired;
                subscription.lastUpdated = DateTime.Now;
                
                RemoveSubscriptionBenefits(subscription.playerId);
                
                // Send notification
                if (notificationManager != null)
                {
                    notificationManager.SendSubscriptionNotification(subscription.playerId, "subscription_expired", subscription.planId);
                }
            }
        }
        
        private void ProcessRenewals()
        {
            var renewals = playerSubscriptions.Values
                .Where(s => s.status == SubscriptionStatus.Active && s.autoRenew && s.nextBillingDate <= DateTime.Now)
                .ToList();
            
            foreach (var subscription in renewals)
            {
                var plan = GetSubscriptionPlan(subscription.planId);
                if (plan == null) continue;
                
                var price = subscription.billingCycle == 12 ? plan.yearlyPrice : plan.monthlyPrice;
                
                // Process payment
                if (paymentProcessor != null)
                {
                    var paymentSuccess = paymentProcessor.ProcessPayment(subscription.playerId, subscription.planId, price, subscription.currency, subscription.paymentMethod);
                    if (paymentSuccess)
                    {
                        // Renew subscription
                        subscription.startDate = DateTime.Now;
                        subscription.endDate = DateTime.Now.AddMonths(subscription.billingCycle);
                        subscription.nextBillingDate = DateTime.Now.AddMonths(subscription.billingCycle);
                        subscription.amountPaid += price;
                        subscription.lastUpdated = DateTime.Now;
                        
                        // Add to history
                        subscription.history.Add(new SubscriptionHistory
                        {
                            historyId = Guid.NewGuid().ToString(),
                            action = "subscription_renewed",
                            timestamp = DateTime.Now,
                            amount = price,
                            currency = subscription.currency,
                            description = "Subscription renewed"
                        });
                    }
                    else
                    {
                        // Payment failed
                        subscription.status = SubscriptionStatus.Failed;
                        subscription.lastUpdated = DateTime.Now;
                        
                        // Send notification
                        if (notificationManager != null)
                        {
                            notificationManager.SendSubscriptionNotification(subscription.playerId, "payment_failed", subscription.planId);
                        }
                    }
                }
            }
        }
        
        public Dictionary<string, object> GetSubscriptionAnalytics()
        {
            if (subscriptionAnalytics == null) return new Dictionary<string, object>();
            
            return subscriptionAnalytics.GetAnalytics();
        }
        
        void OnDestroy()
        {
            if (subscriptionCheckCoroutine != null)
            {
                StopCoroutine(subscriptionCheckCoroutine);
            }
        }
    }
    
    // Supporting classes
    public class PaymentProcessor : MonoBehaviour
    {
        public void Initialize() { }
        public bool ProcessPayment(string playerId, string planId, float amount, string currency, PaymentMethod paymentMethod) { return true; }
    }
    
    public class SubscriptionAnalytics : MonoBehaviour
    {
        public void Initialize() { }
        public Dictionary<string, object> GetAnalytics() { return new Dictionary<string, object>(); }
    }
    
    public class NotificationManager : MonoBehaviour
    {
        public void Initialize() { }
        public void SendSubscriptionNotification(string playerId, string type, string planId) { }
    }
}